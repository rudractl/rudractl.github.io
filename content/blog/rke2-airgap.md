---
title: "Building an Air-Gapped Kubernetes Cluster with RKE2"
slug: rke2-airgap
description: >
  Lessons learned while designing an offline Kubernetes deployment —
  registries, images, upgrades and the things that quietly need the internet.
published: 2026-10-13
status: draft # sample written by Claude — review/rewrite before publishing
tags:
  - Kubernetes
  - RKE2
  - Infrastructure
featured: true
---

Running Kubernetes without internet access sounds like a packaging problem.
It is actually a **supply-chain** problem: every image, chart, binary and
certificate has to be accounted for before the first node boots.

## Architecture

```text
┌───────────────────────────────┐
│ Internet-connected machine    │
│              │                │
│              ▼                │
│        Private Registry       │
│              │                │
│              ▼                │
│         RKE2 Cluster          │
└───────────────────────────────┘
```

The connected machine is the only place that ever talks to the outside world.
It pulls, verifies and bundles artifacts; everything else consumes the bundle.

## What you need to carry across

| Artifact            | Source                       | Notes                                  |
| ------------------- | ---------------------------- | -------------------------------------- |
| RKE2 binaries       | GitHub releases              | `rke2.linux-amd64.tar.gz` + checksums  |
| Core images         | `rke2-images.linux-amd64.*`  | Ships as a tarball, no registry needed |
| Workload images     | Your registry mirror         | Harbor works well                      |
| Helm charts         | Chart repositories           | Package with `helm pull`               |
| OS packages         | Distro mirrors               | SELinux policy RPMs are easy to forget |

## Pointing RKE2 at a private registry

RKE2 reads mirrors from `/etc/rancher/rke2/registries.yaml`:

```yaml
mirrors:
  docker.io:
    endpoint:
      - "https://registry.internal.example:5000"
configs:
  "registry.internal.example:5000":
    tls:
      ca_file: /etc/rancher/rke2/registry-ca.pem
```

> [!NOTE]
> Mirror `docker.io`, `quay.io`, `ghcr.io` and `registry.k8s.io` even if you
> think you only use one of them. Charts love to surprise you.

## The things that quietly need the internet

- **Helm charts with hooks** that pull images not listed in `values.yaml`.
- **Operators** that download CRDs or binaries at runtime.
- **Time.** No NTP means certificate validation gets weird fast.

> [!WARNING]
> Test the bundle on a network with **no** default route. "Firewalled" is not
> the same as "air-gapped", and the difference shows up on install day.

## Upgrades

Treat an upgrade as a new bundle: build it, verify it in a staging air gap,
then roll control-plane nodes one at a time with the system-upgrade-controller.

## Takeaways

1. Inventory every artifact before you design anything else.
2. Automate the bundle build — you will do it again for every upgrade.
3. Rehearse in a truly disconnected environment.

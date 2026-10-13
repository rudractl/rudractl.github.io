---
title: "Understanding Kubernetes Upgrade Strategies"
slug: kubernetes-upgrade-strategies
description: >
  In-place, blue/green or rebuild? A practical look at how to upgrade
  clusters without surprising the people running workloads on them.
published: 2026-09-21
status: published
tags:
  - Kubernetes
  - Platform Engineering
featured: false
---

Kubernetes ships a minor release roughly every four months. If your platform
cannot upgrade comfortably, it will fall behind — and catching up is far more
painful than keeping up.

## Three strategies

### 1. In-place rolling upgrade

Upgrade control-plane nodes one at a time, then drain and upgrade workers.

- ✅ Cheap, no extra capacity
- ⚠️ Rollback is hard once etcd has been migrated

### 2. Blue/green node pools

Create a new pool on the target version, cordon the old pool, migrate workloads.

- ✅ Easy to pause and roll back workers
- ⚠️ Needs spare capacity

### 3. Rebuild and migrate

Stand up a new cluster and move workloads with GitOps.

- ✅ Cleanest result, great for skipping versions
- ⚠️ Stateful workloads need a real migration plan

## Before any upgrade

```bash
# Find deprecated APIs still in use
kubectl get --raw /metrics | grep apiserver_requested_deprecated_apis

# Check PodDisruptionBudgets that will block drains
kubectl get pdb -A -o wide
```

> [!TIP]
> A PodDisruptionBudget with `maxUnavailable: 0` will stall your drain forever.
> Find them before the maintenance window, not during it.

## Make it boring

The goal is an upgrade that nobody notices. That means automation, a staging
cluster that mirrors production, and a runbook you actually rehearse.

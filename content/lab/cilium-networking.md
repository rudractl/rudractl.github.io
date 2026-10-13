---
name: Cilium Networking
slug: cilium-networking
status: active
featured: true
started: 2026-06-01
technologies:
  - Cilium
  - eBPF
  - Kubernetes
  - Hubble
summary: >
  Replacing kube-proxy with Cilium's eBPF datapath, then poking at it
  with Hubble until it makes sense.
---

## Goals

1. Run Cilium in kube-proxy-free mode on RKE2.
2. Write L3/L4 and L7 network policies and verify them with Hubble.
3. Compare service latency before and after.

## Notes so far

```bash
cilium install --set kubeProxyReplacement=true
cilium status --wait
hubble observe --namespace demo --verdict DROPPED
```

> [!TIP]
> `hubble observe --verdict DROPPED` is the fastest way to find out which
> policy is eating your traffic.

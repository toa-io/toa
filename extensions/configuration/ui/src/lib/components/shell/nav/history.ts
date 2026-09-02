/// <reference types="@types/dom-navigation" />
import { goto } from '$app/navigation'

function path(url: URL): string {
  return url.pathname + url.search + url.hash
}

function closest(target: string): number {
  const entry = window.navigation.currentEntry

  if (entry === null) return -1

  const entries = window.navigation.entries()

  for (let i = entry.index - 1; i >= 0; i--) {
    const url = entries[i].url

    if (url !== null && path(new URL(url)) === target)
      return entry.index - i
  }

  return -1
}

export async function back(href: string): Promise<void> {
  if (window.navigation.canGoBack) window.history.back()
  else await goto(href)
}

export async function jump(href: string): Promise<void> {
  const target = path(new URL(href, window.location.href))
  const index = closest(target)

  if (index > 0 && index <= 42) window.history.go(-index)
  else await goto(href)
}

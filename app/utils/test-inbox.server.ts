let lastMagicLink: string | null = null;

export function setLastMagicLink(link: string) {
  lastMagicLink = link;
}

export function getLastMagicLink(): string | null {
  return lastMagicLink;
}

export function clearTestInbox() {
  lastMagicLink = null;
}

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

function getBackendRoot() {
  return process.cwd().endsWith('/apps/backend') ? process.cwd() : join(process.cwd(), 'apps/backend');
}

export const uploadsRootDirectory = join(getBackendRoot(), 'uploads');
export const avatarUploadDirectory = join(uploadsRootDirectory, 'avatars');

export function ensureAvatarUploadDirectory() {
  mkdirSync(avatarUploadDirectory, { recursive: true });
}

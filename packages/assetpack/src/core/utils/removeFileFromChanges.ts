import type { ChangeData } from 'src/core/AssetWatcher.js';

export function removeFileFromChanges(changes: ChangeData[], filePath: string) {
    const index = changes.findIndex((change) => change.file === filePath);

    if (index !== -1) {
        changes.splice(index, 1);
    }
}

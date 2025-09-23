import * as MediaLibrary from 'expo-media-library';

/**
 * Resolve an asset object or URI to a usable localUri (file://) when possible.
 * Accepts: MediaLibrary.Asset | string
 * Returns: localUri string or original uri as fallback.
 */
export default async function resolveMediaUri(input: any): Promise<string | null> {
  try {
    if (!input) return null;

    // if passed a string URI, try to use it directly first
    if (typeof input === 'string') {
      // if it's a ph:// or asset-library:// style URI, try to get asset info
      if (input.startsWith('ph://') || input.startsWith('assets-library://') || input.startsWith('ph-asset://')) {
        // try to find asset by id
        try {
          const info = await MediaLibrary.getAssetInfoAsync(input);
          return info && info.localUri ? info.localUri : input;
        } catch (e) {
          return input;
        }
      }
      return input;
    }

    // if it's an asset object
    if (input && typeof input === 'object') {
      try {
        const info = await MediaLibrary.getAssetInfoAsync(input);
        if (info && info.localUri) return info.localUri;
      } catch (e) {
        // some versions expect id string
        try {
          const info = await MediaLibrary.getAssetInfoAsync(input.id || input.localId || input.uri);
          if (info && info.localUri) return info.localUri;
        } catch (e2) {
          // fallthrough
        }
      }

      // fallback to asset.localUri or asset.uri
      return input.localUri || input.uri || null;
    }

    return null;
  } catch (e) {
    return null;
  }
}

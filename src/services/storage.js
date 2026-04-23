/**
 * Storage service — Cloudinary (unsigned upload)
 * Cloud: dymhrqo3i | Preset: ml_default
 */

const CLOUDINARY_CLOUD = 'dymhrqo3i'
const CLOUDINARY_PRESET = 'ml_default'
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/upload`

export const storage = {
    /**
     * Upload a file to Cloudinary
     * @param {File} file - The file object to upload
     * @param {string} folder - Cloudinary folder (e.g., 'orders/123')
     */
    upload: async (file, folder = 'general') => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', CLOUDINARY_PRESET)
        formData.append('folder', `rocadeiras/${folder}`)

        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.error?.message || 'Erro no upload')
        }

        const data = await response.json()

        return {
            url: data.secure_url,
            path: data.public_id,   // public_id serves as the path for deletion
            provider: 'cloudinary',
            width: data.width,
            height: data.height,
            format: data.format,
        }
    },

    /**
     * Delete a file from Cloudinary
     * Note: unsigned presets typically restrict deletion.
     * Deletion via API requires signing — we skip it silently.
     */
    delete: async (path, provider = 'cloudinary') => {
        // Cloudinary unsigned deletion is not supported without a server.
        // Files will be managed via the Cloudinary dashboard or a cleanup job.
        console.info(`[storage] Skipping delete for ${provider}:${path} (unsigned preset)`)
    },

    /**
     * For external links (YouTube etc.)
     */
    processExternalLink: async (url, type = 'youtube') => {
        if (type === 'youtube') {
            return { url, provider: 'youtube' }
        }
        throw new Error('Invalid external link type.')
    },
}

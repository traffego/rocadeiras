import { supabase } from '@/lib/supabase'

/**
 * Storage providers: 'supabase' (default), 'r2', 'youtube'
 */
const STORAGE_CONFIG = {
    provider: 'supabase', // In the future, this can be fetched from a settings table or env
}

export const storage = {
    /**
     * Upload a file according to the configured provider
     * @param {File} file - The file object to upload
     * @param {string} folder - Target folder (e.g., 'orders/123')
     */
    upload: async (file, folder = 'general') => {
        if (STORAGE_CONFIG.provider === 'supabase') {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `${folder}/${fileName}`

            const { data, error } = await supabase.storage
                .from('service-orders')
                .upload(filePath, file)

            if (error) throw error

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('service-orders')
                .getPublicUrl(filePath)

            return {
                url: publicUrl,
                path: filePath,
                provider: 'supabase'
            }
        }

        if (STORAGE_CONFIG.provider === 'r2') {
            // Placeholder for R2 implementation
            throw new Error("R2 storage provider is currently disabled.")
        }

        throw new Error("Invalid storage provider configuration.")
    },

    /**
     * For YouTube or other external links, we don't upload, just validate/process
     */
    processExternalLink: async (url, type = 'youtube') => {
        if (type === 'youtube') {
            // Extract ID or just return the URL if already formatted
            // Structure: https://www.youtube.com/embed/ID
            return {
                url: url,
                provider: 'youtube'
            }
        }
        throw new Error("Invalid external link type.")
    },

    /**
     * Delete a file
     */
    delete: async (path, provider = 'supabase') => {
        if (provider === 'supabase') {
            const { error } = await supabase.storage
                .from('service-orders')
                .remove([path])
            if (error) throw error
        }
        // R2 delete would go here
    }
}

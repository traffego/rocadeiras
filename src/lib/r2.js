// Cloudflare R2 configuration
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL

/**
 * Upload de arquivo para R2 via presigned URL
 * Por enquanto, retorna URL mock para desenvolvimento
 */
export async function uploadToR2(file, folder = 'uploads') {
    // TODO: Implementar upload real para R2
    // Por enquanto, cria URL local para preview
    const localUrl = URL.createObjectURL(file)

    return {
        success: true,
        url: localUrl,
        key: `${folder}/${Date.now()}-${file.name}`
    }
}

/**
 * Gera URL pública do R2
 */
export function getR2Url(key) {
    if (!R2_PUBLIC_URL) return null
    return `${R2_PUBLIC_URL}/${key}`
}

export default { uploadToR2, getR2Url }

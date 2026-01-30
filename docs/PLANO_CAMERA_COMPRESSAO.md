# Câmera do Celular + Compressão de Imagens

Adicionar suporte para tirar fotos diretamente da câmera do celular, converter formatos HEIC/HEIF para JPG, e comprimir imagens antes do upload.

## Dependências

Instalar via:
```bash
npm install heic2any browser-image-compression
```

| Pacote | Uso |
|--------|-----|
| `heic2any` | Converte HEIC/HEIF (formato nativo iOS) para JPG/PNG |
| `browser-image-compression` | Comprime imagens no browser antes do upload |

---

## Alterações Necessárias

### 1. Novo arquivo: `src/lib/imageUtils.js`

Funções:
- `convertHeicToJpeg(file)` - Converte HEIC para JPG
- `compressImage(file, options)` - Comprime imagem
- `processImage(file)` - Pipeline completo

Configurações de compressão:
```javascript
{
    maxSizeMB: 1,           // Tamanho máximo: 1MB
    maxWidthOrHeight: 1920, // Dimensão máxima
    useWebWorker: true,     // Processar em background
    fileType: 'image/jpeg'  // Output padrão
}
```

### 2. Modificar: `src/pages/NewOrder.jsx`

- Input da câmera: `accept="image/*" capture="environment"`
- Remover vídeos do accept
- Chamar `processImage()` antes do upload
- UI: Dois botões - "📷 Tirar Foto" e "📁 Galeria"

### 3. Modificar: `src/pages/OrderDetail.jsx`

- Mesmo padrão do NewOrder
- Remover função `handleYouTubeLink` e botão

### 4. Modificar: `src/services/storage.js`

- Remover função `processExternalLink` (YouTube)

---

## Configuração do Bucket Supabase

### Passo a Passo

1. Acesse o painel do Supabase
2. Vá para Storage → "New bucket"
3. Nome: `service-orders`, marque "Public bucket"
4. Configure as políticas:

**Política de UPLOAD (INSERT)**:
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'service-orders');
```

**Política de LEITURA (SELECT)**:
```sql
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'service-orders');
```

**Política de DELEÇÃO (DELETE)**:
```sql
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'service-orders');
```

---

## Verificação

- Rodar `npm run dev -- --host` para testar no celular
- Testar botão de câmera e galeria
- Testar upload de HEIC (iPhone)
- Verificar compressão de imagens grandes

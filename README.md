# FlopOS — repositorio Homebrew para LG webOS

Repositorio compatible con [Homebrew Channel](https://github.com/webosbrew/webos-homebrew-channel)
que sirve la app de prueba **FlopOS**.

## Cómo instalar en la TV

1. Abre **Homebrew Channel** en tu LG.
2. Ve a **Settings → Add repository**.
3. Pega esta URL:

   ```
   https://sertecvigo.github.io/flopos/apps.json
   ```

4. Vuelve a la lista de apps: aparecerá **FlopOS** → pulsa **Install**.

## Contenido

| Fichero | Función |
|---|---|
| `apps.json` | Índice del repositorio que lee el Homebrew Channel |
| `flopos.manifest.json` | Manifiesto de la app (versión, ipkUrl, hash) |
| `com.flop.flopos_1.0.0_all.ipk` | El paquete instalable |
| `icon.png` | Icono de la app |

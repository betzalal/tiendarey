# Despliegue de `testphoneapp` en VPS (144.91.118.73)

El proyecto ha sido preparado para ser subido a un nuevo repositorio Git y posteriormente desplegado en tu VPS usando Node.js y PM2.

---

## Parte 1: Subir a un Nuevo Git (testphoneapp)

Abre la terminal en la carpeta raíz de tu proyecto (`e:\app\store phone`) y ejecuta los siguientes comandos:

```bash
# 1. Si ya tenías un git anterior y quieres uno completamente nuevo sin el historial viejo:
# (Opcional, solo si quieres borrar la historia de Git)
rm -rf .git  # En Windows PowerShell usa: Remove-Item -Recurse -Force .git

# 2. Inicializar el nuevo repositorio
git init

# 3. Agregar todos los archivos preparados
git add .

# 4. Crear el primer commit
git commit -m "Initial commit - testphoneapp con Sincronización Web-Móvil"

# 5. Cambiar el branch principal a 'main'
git branch -M main

# 6. Conectar con tu nuevo repositorio en GitHub
git remote add origin https://github.com/betzalal/tiendarey.git

# 7. Subir el código
git push -u origin main
```

*(Nota: El archivo `.gitignore` ya está configurado para NO subir tus archivos `sawalife.db` privados ni los `node_modules`.)*

---

## Parte 2: Despliegue en el VPS (IP: 144.91.118.73)

Para que el servidor VPS aloje tanto el panel web como las conexiones a la Nube temporales, sigue estos pasos conectándote por SSH a tu VPS:

```bash
# Conectarte al VPS
ssh root@144.91.118.73
# (Pon tu contraseña, o usa la llave SSH si la tienes)
```

Dentro del servidor VPS:

```bash
# 1. Clonar el repositorio que acabas de subir
git clone https://github.com/betzalal/tiendarey.git
cd tiendarey

# 2. Instalar dependencias del servidor
cd server
npm install
cd ..

# 3. Iniciar el sistema con PM2 usando el archivo de configuración que acabo de crearte
# Si no tienes pm2 instalado, ejecuta antes: npm install -g pm2
pm2 start ecosystem.config.js

# 4. Configurar para que inicie automáticamente si el servidor de la Nube se reinicia (Opcional)
pm2 startup
pm2 save
```

### ¿Cómo funciona en el VPS?
He configurado `server/index.js` para que automáticamente detecte la carpeta `client/dist` (El FrontEnd compilado). Al entrar a `http://144.91.118.73:3002`, Express te entregará tu interfaz React mágicamente unificada en el puerto 3002. ¡Ahora la Nube Web opera sola bajo ese servidor!

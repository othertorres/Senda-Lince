# Entornos y recuperación de Senda Lince

## Estado comprobado el 21 de octubre de 2026

- Producción: https://senda-lince.netlify.app/ — edición BETA LOCAL v5.5.
- GitHub: https://github.com/othertorres/Senda-Lince.
- El repositorio inicialmente solo contenía `README.md`, en el commit
  `74ba3af18f3fecab0700a9bee06571cb076dbf49`. `main` se conserva intacta.
- Se recuperaron el HTML y todos los recursos de ejecución referenciados
  recursivamente: 16 archivos, incluidos módulos JavaScript, CSS, manifiesto e iconos.
- Copia de recuperación: rama `recovery/published-v5.5-2026-10-21`, commit
  `e441d6fdaa8d3cb661c0eb2b3f4c51b780632d6c`.
- Desarrollo y pruebas: rama `feature/saas-security`.
- `recovery/production-manifest.json` registra fecha, URLs, tamaños, SHA-256 y
  cabeceras de seguridad observadas. Los archivos de `public/` conservan sus bytes.

Esta copia cubre los archivos públicos que necesita la aplicación. No es una
exportación autenticada del despliegue de Netlify: no se han recuperado su ID,
historial, configuración privada, archivos no referenciados ni posibles fuentes
de desarrollo no publicadas. No se ha probado una restauración en Netlify.
La aplicación almacena los datos del usuario en el navegador; estos datos no
forman parte del código ni de esta copia.

## Pruebas locales separadas

Requiere Python 3.10 o posterior, sin instalar dependencias:

```sh
git clone --branch feature/saas-security https://github.com/othertorres/Senda-Lince.git
cd Senda-Lince
python3 scripts/verify_snapshot.py
python3 scripts/serve_staging.py
```

Abrir `http://127.0.0.1:4173` en el equipo donde se ejecuta el servidor.
El servidor solo escucha en la interfaz local y solo sirve `public/`.
No publica el repositorio, no muestra listados de directorios y añade
`X-Senda-Environment: staging-local`, exclusión de indexación y caché desactivada.
Conserva las cabeceras de seguridad relevantes observadas en producción.

El origen HTTP local tiene su propio almacenamiento del navegador, distinto del
origen HTTPS de Netlify. Usar datos ficticios. No importar copias de datos reales.
La copia actual no tiene cuentas, base de datos remota, cobros ni llamadas a APIs.
No se han creado claves de pago, ni de prueba ni reales.

Este es un entorno local reproducible. No existe todavía un entorno de pruebas
alojado en Netlify ni una URL de pruebas compartida. Una instancia arrancada en
el entorno de trabajo es temporal y no equivale a alojamiento permanente.

## Recuperar exactamente los archivos publicados capturados

En un directorio nuevo, sin reemplazar un checkout con trabajo pendiente:

```sh
git clone https://github.com/othertorres/Senda-Lince.git Senda-Lince-restauracion
cd Senda-Lince-restauracion
git switch --detach e441d6fdaa8d3cb661c0eb2b3f4c51b780632d6c
python3 -m http.server 4174 --bind 127.0.0.1 --directory public
```

Para volver a publicar estos archivos en el futuro, la carpeta de publicación es
`public/` y no requiere compilación. Primero probarlos en otro sitio de Netlify.
La restauración local no cambia producción. Para restaurar además las políticas
HTTP, consultar las cabeceras registradas en el manifiesto y la configuración
original de Netlify, que aún no está disponible.

## Siguiente paso para pruebas alojadas

Se necesita acceso al proyecto de Netlify o una exportación de su configuración y
del despliegue actual. Comprobar primero cómo se publica producción (manual o Git),
su ID de despliegue, rama de producción y ajustes. Crear después un sitio de pruebas
independiente, protegido por control de acceso, con datos y variables propios.
No cambiar el dominio actual, no conectar esta rama como rama de producción y no
ejecutar despliegues con `--prod` sobre el sitio existente.

Los cambios comerciales se harán en `feature/saas-security`. Las futuras
integraciones de datos y pagos necesitan recursos exclusivos de pruebas y modo
sandbox; nunca deben reutilizar credenciales o bases de datos de producción.
Los secretos se excluyen mediante `.gitignore` y se deben configurar en el entorno
correspondiente cuando se implemente cada integración.

## Validación realizada

- Los 16 archivos se descargaron de nuevo después de guardar la copia en Git:
  todos coincidían con sus SHA-256.
- Sintaxis de los ocho módulos JavaScript comprobada con Node.
- Scripts Python compilados y copia local verificada contra el manifiesto.
- Servidor local comprobado por HTTP: 16 recursos idénticos y cabeceras correctas.
- Seis comprobaciones de rutas internas y listados devolvieron 404.
- No se ha realizado una prueba visual/interactiva en navegador, ni una
  restauración o un despliegue de pruebas en Netlify.

# Repositorio listo para GitHub

Esta estructura deja la app publica en la raiz para GitHub Pages y separa la documentacion tecnica para que el repo sea mas facil de mantener.

## Estructura recomendada

```text
TennisSimu/
|- index.html
|- css/
|- js/
|- img/
|- tools/
|- docs/
|  |- ENGINE.md
|  `- REPOSITORY.md
|- README.md
|- .gitignore
`- .gitattributes
```

## Que se sube

- `index.html`, `css/`, `js/`, `img/`: aplicacion y assets que usa la web.
- `tools/`: scripts de construccion y calibracion.
- `docs/`: documentacion tecnica y notas internas que conviene versionar.
- `README.md`: portada del proyecto.

## Que no conviene subir

- secretos o credenciales (`.env`, claves, certificados)
- caches, logs y carpetas de editor
- material local de descarte o borradores
- datasets crudos gigantes si no son necesarios para ejecutar o revisar el proyecto

## Nota sobre imagenes locales

La ruta `img/Nueva carpeta/` se ha marcado como local y queda excluida por `.gitignore`. Parece contener variantes y borradores que no forman parte del sitio publicado.

## Checklist antes del primer push

1. Revisa que solo vayan archivos necesarios para ejecutar la web.
2. Comprueba que no haya datos sensibles embebidos en `js/` o `tools/`.
3. Si inicializas Git, haz un primer commit pequeno y revisable.
4. Publica con GitHub Pages usando la raiz del repositorio o la rama que prefieras.

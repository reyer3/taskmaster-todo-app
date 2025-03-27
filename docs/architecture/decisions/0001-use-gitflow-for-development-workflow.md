# 0001 - Uso de Git Flow para el flujo de trabajo de desarrollo

Fecha: 2025-03-27

## Estado

Aceptado

## Contexto

El proyecto TaskMaster requiere un flujo de trabajo de desarrollo organizado y estructurado que permita:
- Trabajar en paralelo a múltiples miembros del equipo
- Gestionar releases de manera ordenada
- Implementar hotfixes rápidamente cuando sea necesario
- Mantener un historial de cambios claro y comprensible
- Facilitar la integración continua y despliegue continuo (CI/CD)

Hasta ahora, el proyecto ha estado utilizando un enfoque ad-hoc para el control de versiones, lo que ha llevado a confusiones y conflictos durante el desarrollo. Necesitamos una estrategia de branching clara y bien definida.

## Decisión

Hemos decidido adoptar **Git Flow** como nuestro flujo de trabajo de desarrollo. Git Flow es un modelo de ramificación para Git que define un conjunto de procedimientos para trabajar con Git en proyectos de desarrollo.

### Estructura de ramas

- **main**: Rama principal que contiene código de producción. Solo se fusiona desde `develop` (para releases) o `hotfix` (para correcciones urgentes).
- **develop**: Rama de desarrollo principal donde se integran todas las características.
- **feature/\***: Ramas para desarrollar nuevas características. Se crean desde `develop` y se fusionan de vuelta a `develop`.
- **release/\***: Ramas para preparar releases. Se crean desde `develop` y se fusionan a `main` y de vuelta a `develop`.
- **hotfix/\***: Ramas para correcciones urgentes. Se crean desde `main` y se fusionan a `main` y `develop`.

### Proceso de desarrollo

1. Para iniciar el desarrollo de una nueva característica:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/nombre-de-la-caracteristica
   ```

2. Para finalizar una característica:
   ```bash
   git checkout develop
   git pull
   git merge --no-ff feature/nombre-de-la-caracteristica
   git push origin develop
   ```

3. Para crear una release:
   ```bash
   git checkout develop
   git pull
   git checkout -b release/x.y.z
   # Aquí se realizan ajustes finales y bump de versión
   git checkout main
   git merge --no-ff release/x.y.z
   git tag -a vx.y.z -m "Versión x.y.z"
   git checkout develop
   git merge --no-ff release/x.y.z
   git branch -d release/x.y.z
   git push --all
   git push --tags
   ```

4. Para crear un hotfix:
   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/x.y.z
   # Aquí se realizan las correcciones urgentes
   git checkout main
   git merge --no-ff hotfix/x.y.z
   git tag -a vx.y.z -m "Versión x.y.z"
   git checkout develop
   git merge --no-ff hotfix/x.y.z
   git branch -d hotfix/x.y.z
   git push --all
   git push --tags
   ```

## Consecuencias

### Positivas

* Clara separación entre trabajo en progreso y código estable
* Facilita el desarrollo paralelo por múltiples miembros del equipo
* Proporciona un proceso claro para releases y hotfixes
* Historial de Git más claro y comprensible
* Mejora la colaboración y reducción de conflictos de merge
* Facilita la CI/CD con ramas bien definidas

### Negativas

* Mayor complejidad que un flujo de trabajo simple basado en `main`
* Requiere que todos los miembros del equipo entiendan el flujo de trabajo
* Puede ser excesivo para proyectos muy pequeños o con pocos colaboradores
* Se requiere disciplina para seguir el proceso correctamente

### Neutral

* Puede requerir herramientas adicionales o extensiones de Git para facilitar el flujo de trabajo
* Las ramas de larga duración pueden requerir merges más complejos

## Alternativas Consideradas

* **GitHub Flow**: Más simple, basado en ramas de features directamente desde `main` y pull requests. No tiene ramas específicas para releases.
* **Trunk-Based Development**: Desarrollo más rápido pero con mayor riesgo, donde la mayoría del desarrollo ocurre en la rama principal.
* **Flujo personalizado**: Crear nuestro propio flujo adaptado a las necesidades específicas del proyecto.

## Referencias

* [Git Flow - Vincent Driessen](https://nvie.com/posts/a-successful-git-branching-model/)
* [Git Flow Cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/)
* [Git Flow vs GitHub Flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
* [Implementing Git Flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)

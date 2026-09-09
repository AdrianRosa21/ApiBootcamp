# Evidencia de QA (Quality Assurance)

## Backend y Pruebas Unitarias

- **Pytest**: Se ejecutaron exitosamente las 34 pruebas del backend.
- **Cobertura**: Las pruebas evalúan el contrato de la API, análisis de métricas, negaciones, puntuación, caracteres Unicode, errores de validación, manejo de CORS, límites de la API y lógica del endpoint de comparación.
- **Fallos mitigados**: Se solucionó un problema específico en el entorno de pruebas donde parámetros extremadamente largos producían una variable de entorno `PYTEST_CURRENT_TEST` mayor al límite en Windows.

## Frontend y Validación Visual (Prevista)

- Las interacciones de la UI, el editor, comparación de versiones y el historial.
- Manejo adecuado de estados y fallos de red hacia la API.
- Accesibilidad, navegación mediante teclado y contraste de colores en temas claros/oscuros.
- Diseño responsivo en móviles (reorganización de las columnas en el orden de lectura).

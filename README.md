# Plataforma Agnóstica para la Comercialización y Certificación Segura de Agentes de IA 🚀

## E.T.S. de Ingeniería Informática — Universidad de Málaga
* **Autor:** Jaime Garfia Aragón
* **Tutor:** Antonio Maña Gómez
* **Departamento:** Lenguajes y Ciencias de la Computación
* **Convocatoria / Deadline:** Junio 2026

---

## Descripción del Proyecto

Este repositorio contiene la implementación práctica del Trabajo de Fin de Grado destinado al diseño, desarrollo y validación de una infraestructura de mediación y gobierno agnóstica para la distribución segura y certificación técnica de agentes de Inteligencia Artificial y automatizaciones empresariales.

A diferencia de los marketplaces de agentes comerciales emergentes (los cuales actúan como ecosistemas propietarios y cerrados que imponen cautividad tecnológica y opacidad de costes), esta plataforma propone un **modelo neutro e independiente** enfocado en democratizar el acceso a la Inteligencia Artificial autónoma bajo un paradigma estricto de **Confianza Cero (Zero Trust)**.

### El Factor Diferencial: Seguridad por Diseño (Security by Design)

El núcleo técnico de este ecosistema aborda el riesgo de los ataques a la cadena de suministro de software (*Software Supply Chain Attacks*) asociados a la ejecución de código autónomo de terceros. La plataforma implementa un flujo automatizado de **Sandboxing e Ingeniería de Requisitos de Seguridad** utilizando la metodología formal *Secure Tropos*, aislando y auditando dinámicamente cada activo digital antes de permitir su publicación en el mercado público.

---

## Arquitectura y Pila Tecnológica (Stack)

La solución se materializa mediante una arquitectura isomórfica desacoplada, seleccionada específicamente para garantizar un rendimiento óptimo, integridad transaccional y soberanía absoluta sobre los datos y activos de IA:

* **Capa de Presentación / Cliente:** [Next.js](https://nextjs.org/) (React) estructurado con [Tailwind CSS](https://tailwindcss.com/) para proveer una interfaz de usuario minimalista y profesional orientada a la conversión de negocio abstracto en "cajas negras cognitivas".
* **Capa de Lógica de Negocio / API Server:** Lógica en el lado del servidor gobernada bajo el tipado estático estricto de [TypeScript](https://www.typescriptlang.org/), evitando la exposición de claves y algoritmos críticos en el cliente.
* **Capa de Persistencia:** [PostgreSQL](https://www.postgresql.org/) alojado en infraestructura *Serverless Cloud* mediante [Neon](https://neon.tech/), asegurando consistencia completa, transacciones atómicas e integridad referencial estricta (Propiedades ACID).
* **Entorno de Certificación y Aislamiento:** [Docker](https://www.docker.com/) encargado de orquestar *sandboxes* herméticos sin acceso a la red interna para la auditoría estática y dinámica de comportamiento de los artefactos.
* **Gobierno de Identidades:** Protocolos estándar [OAuth 2.0 y OpenID Connect](https://openid.net/) delegando la autenticación perimetral de empresas y creadores en proveedores de identidad de confianza.

---

## Modelo Dual de Datos (Esquema Relacional)

La base de datos estructurada en PostgreSQL soporta de manera nativa los dos grandes flujos operativos del negocio del MVP:

1. **`usuarios`**: Entidades de acceso controlado delegadas mediante flujos OAuth 2.0 (Roles: *Anónimo, Desarrollador, Empresa Cliente y Administrator*).
2. **`agentes`**: Catálogo semántico modular con control estricto de estados intermedios (*Borrador, En Auditoría, Certificado, Rechazado*), hashes criptográficos SHA-256 e inmutabilidad mediante firmas digitales.
3. **`auditorias`**: Historial persistente y logs emitidos en tiempo de ejecución por el motor automatizado de Sandboxing en Docker.
4. **`transacciones`**: Registro financiero transaccional para la adquisición segura de derechos de uso integrando pasarelas de pago y webhooks protegidos.
5. **`servicios_fine_tuning`**: Trazabilidad y gobernanza de los flujos de personalización contextual aplicados sobre arquitecturas de referencia con datos privados de empresas clientes.

---

## Configuración y Despliegue Local (Quickstart)

Sigue estos pasos para levantar el entorno de desarrollo local y conectarlo con la base de datos distribuida en la nube:

### 1. Clonar el repositorio
```bash
git clone [https://github.com/jaimegarfia/tfg-marketplace-ia.git](https://github.com/jaimegarfia/tfg-marketplace-ia.git)
cd tfg-marketplace-ia

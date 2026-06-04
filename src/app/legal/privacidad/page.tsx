import type { Metadata } from "next";
import { LegalDocumentLayout } from "@/components/legal/legal-document-layout";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Tratamiento de datos personales en Certia.",
};

const UPDATED_AT = "4 de junio de 2026";

export default function PoliticaPrivacidadPage() {
  return (
    <LegalDocumentLayout
      title="Política de privacidad"
      updatedAt={UPDATED_AT}
    >
      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">
          1. Responsable del tratamiento
        </h2>
        <p>
          Certia Marketplace (proyecto académico / demostración TFG) trata datos
          personales conforme al Reglamento General de Protección de Datos
          (RGPD) y la normativa española aplicable. Contacto: privacidad@certia.local.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">
          2. Datos que recogemos
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-neutral-400">
          <li>Identificación de cuenta: nombre, email, rol (comprador o desarrollador).</li>
          <li>
            Credenciales: hash de contraseña (scrypt); no almacenamos la
            contraseña en texto plano.
          </li>
          <li>
            Actividad comercial: transacciones, solicitudes de adaptación,
            valoraciones y metadatos de activos publicados.
          </li>
          <li>
            Datos técnicos: logs de auditoría en sandbox, hashes de integridad y
            registros de sesión necesarios para seguridad.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">3. Finalidades</h2>
        <ul className="list-disc space-y-2 pl-5 text-neutral-400">
          <li>Gestionar el registro, autenticación y acceso a la plataforma.</li>
          <li>Operar el marketplace, pagos y soporte entre usuarios.</li>
          <li>Ejecutar auditorías de seguridad de activos publicados.</li>
          <li>Cumplir obligaciones legales y prevenir fraude o abuso.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">4. Base legal</h2>
        <p>
          El tratamiento se basa en la ejecución del contrato (cuenta y compras),
          el interés legítimo (seguridad y mejora del servicio) y, cuando
          corresponda, el consentimiento (comunicaciones opcionales o cookies no
          esenciales).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">
          5. Conservación y encargados
        </h2>
        <p>
          Conservamos los datos mientras mantengas la cuenta y el tiempo
          necesario para obligaciones legales. Utilizamos proveedores como Neon
          (base de datos) y infraestructura de despliegue bajo acuerdos de
          encargo de tratamiento cuando aplique en producción.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">6. Tus derechos</h2>
        <p>
          Puedes acceder, rectificar, suprimir, limitar u oponerte al tratamiento,
          y solicitar portabilidad escribiendo a privacidad@certia.local.
          También puedes reclamar ante la Agencia Española de Protección de
          Datos (AEPD).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">7. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas razonables: sesiones firmadas, contraseñas
          hasheadas, auditoría en contenedores aislados y acceso restringido a
          bases de datos. Ningún sistema es infalible; notifica incidentes
          relevantes según la normativa.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">
          8. Cambios en esta política
        </h2>
        <p>
          Publicaremos actualizaciones en esta URL con fecha de revisión. Te
          recomendamos revisarla periódicamente.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}

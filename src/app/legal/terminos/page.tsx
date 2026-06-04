import type { Metadata } from "next";
import { LegalDocumentLayout } from "@/components/legal/legal-document-layout";

export const metadata: Metadata = {
  title: "Términos de servicio",
  description: "Condiciones de uso del marketplace Certia.",
};

const UPDATED_AT = "4 de junio de 2026";

export default function TerminosServicioPage() {
  return (
    <LegalDocumentLayout title="Términos de servicio" updatedAt={UPDATED_AT}>
      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">1. Objeto</h2>
        <p>
          Certia es un marketplace para la comercialización y certificación de
          agentes de inteligencia artificial. Estos términos regulan el acceso y
          el uso de la plataforma por compradores, desarrolladores y visitantes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">2. Cuentas</h2>
        <p>
          Debes proporcionar información veraz al registrarte. Eres responsable
          de la confidencialidad de tus credenciales y de toda actividad
          realizada desde tu cuenta. Certia puede suspender cuentas ante uso
          fraudulento, abusivo o contrario a la ley.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">
          3. Desarrolladores y publicación de activos
        </h2>
        <p>
          Los desarrolladores declaran ser titulares o contar con licencia para
          distribuir los activos que publican. Todo activo pasa por un proceso
          de auditoría automatizada en sandbox; el resultado no sustituye una
          certificación legal ni una garantía absoluta de seguridad.
        </p>
        <p>
          Certia puede rechazar, retirar o marcar activos que incumplan políticas
          de contenido, presenten riesgos inaceptables o induzcan a error en los
          compradores.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">
          4. Compradores y licencias
        </h2>
        <p>
          La adquisición de un activo otorga los derechos descritos en su ficha
          comercial y en la transacción asociada. Salvo indicación expresa, no se
          transfiere propiedad intelectual del código subyacente más allá del
          uso licenciado en cada oferta.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">
          5. Pagos y facturación
        </h2>
        <p>
          Los precios se muestran en USD salvo indicación contraria. Las
          transacciones pueden procesarse mediante proveedores de pago
          externos; Certia no almacena datos completos de tarjetas en su base de
          datos principal.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">
          6. Servicios de adaptación
        </h2>
        <p>
          Las solicitudes de fine-tuning o personalización constituyen un
          acuerdo entre comprador y desarrollador mediado por la plataforma. Los
          plazos, entregables y responsabilidades contractuales específicas se
          acuerdan caso por caso fuera del alcance mínimo de estos términos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">
          7. Limitación de responsabilidad
        </h2>
        <p>
          Certia se ofrece «tal cual». En la medida permitida por la ley, no
          respondemos por daños indirectos, lucro cesante o pérdida de datos
          derivados del uso de activos de terceros desplegados en infraestructura
          ajena a nuestra plataforma.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium text-neutral-100">
          8. Modificaciones y ley aplicable
        </h2>
        <p>
          Podemos actualizar estos términos publicando la nueva versión en esta
          página. El uso continuado tras el cambio implica aceptación. Para
          consultas: legal@certia.local.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}

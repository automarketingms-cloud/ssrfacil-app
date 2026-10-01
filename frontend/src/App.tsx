import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";
import RutaProtegida from "./components/RutaProtegida";
import { lazyConReintento as lazy } from "./utils/lazy";

// Cada página se descarga recién cuando se entra a su ruta
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MiPerfil = lazy(() => import("./pages/MiPerfil"));

const ListarClientes = lazy(() => import("./pages/ListarClientes"));
const DetalleCliente = lazy(() => import("./pages/DetalleCliente"));
const RegistrarCliente = lazy(() => import("./pages/RegistrarCliente"));
const EditarCliente = lazy(() => import("./pages/EditarCliente"));

const IngresarLectura = lazy(() => import("./pages/IngresarLectura"));
const RutaLectura = lazy(() => import("./pages/RutaLectura"));
const HistorialLecturas = lazy(() => import("./pages/HistorialLecturas"));
const RegistrarLecturaMatriz = lazy(
  () => import("./pages/RegistrarLecturaMatriz"),
);
const HistorialLecturaMatriz = lazy(
  () => import("./pages/HistorialLecturaMatriz"),
);
const VerConsumo = lazy(() => import("./pages/VerConsumo"));

const RegistrarPresion = lazy(() => import("./pages/RegistrarPresion"));
const EditarMedicionPresion = lazy(
  () => import("./pages/EditarMedicionPresion"),
);
const RegistrarCorte = lazy(() => import("./pages/RegistrarCorte"));

const ListarTarifas = lazy(() => import("./pages/ListarTarifas"));
const CrearTarifa = lazy(() => import("./pages/CrearTarifa"));
const ResumenMensual = lazy(() => import("./pages/ResumenMensual"));

const Facturacion = lazy(() => import("./pages/Facturacion"));
const DetalleFactura = lazy(() => import("./pages/DetalleFactura"));
const RegistrarPago = lazy(() => import("./pages/RegistrarPago"));
const MiCaja = lazy(() => import("./pages/MiCaja"));
const DetalleCaja = lazy(() => import("./pages/DetalleCaja"));
const GestionCajas = lazy(() => import("./pages/GestionCajas"));

const ListarReclamos = lazy(() => import("./pages/ListarReclamos"));
const RegistrarReclamo = lazy(() => import("./pages/RegistrarReclamo"));
const DetalleReclamo = lazy(() => import("./pages/DetalleReclamo"));
const EditarReclamo = lazy(() => import("./pages/EditarReclamo"));

const ReportesIndex = lazy(() => import("./pages/ReportesIndex"));
const ReporteFacturacion = lazy(() => import("./pages/ReporteFacturacion"));
const ReportePresion = lazy(() => import("./pages/ReportePresion"));
const ReporteContinuidad = lazy(() => import("./pages/ReporteContinuidad"));
const ReporteReclamos = lazy(() => import("./pages/ReporteReclamos"));

const ReportesInternos = lazy(() => import("./pages/ReportesInternos"));
const ComparativaAgua = lazy(() => import("./pages/ComparativaAgua"));
const ReporteClientesSubsidio = lazy(
  () => import("./pages/ReporteClientesSubsidio"),
);
const ReportePagos = lazy(() => import("./pages/ReportePagos"));

const Configuracion = lazy(() => import("./pages/Configuracion"));
const ListarUsuarios = lazy(() => import("./pages/ListarUsuarios"));
const RegistrarUsuario = lazy(() => import("./pages/RegistrarUsuario"));
const EditarUsuario = lazy(() => import("./pages/EditarUsuario"));
const CrearEmpresa = lazy(() => import("./pages/CrearEmpresa"));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <RutaProtegida>
                <Layout />
              </RutaProtegida>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="/perfil" element={<MiPerfil />} />

            {/* Clientes: listar/ver abiertos a los 3 roles (terreno elige cliente al tomar lecturas) */}
            <Route path="/clientes" element={<ListarClientes />} />
            <Route path="/clientes/:id" element={<DetalleCliente />} />
            <Route
              path="/clientes/nuevo"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <RegistrarCliente />
                </RutaProtegida>
              }
            />
            <Route
              path="/clientes/:id/editar"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <EditarCliente />
                </RutaProtegida>
              }
            />

            {/* Grupo Terreno: abierto a los 3 roles */}
            <Route path="/lecturas" element={<IngresarLectura />} />
            <Route path="/lecturas/ruta" element={<RutaLectura />} />
            <Route path="/presion" element={<RegistrarPresion />} />
            <Route
              path="/presion/:id/editar"
              element={<EditarMedicionPresion />}
            />
            <Route path="/continuidad" element={<RegistrarCorte />} />
            <Route
              path="/lectura-matriz"
              element={<RegistrarLecturaMatriz />}
            />

            {/* Grupo Lecturas (histórico oficina/supervisión) */}
            <Route
              path="/lecturas/historial"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <HistorialLecturas />
                </RutaProtegida>
              }
            />
            <Route
              path="/lectura-matriz/historial"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <HistorialLecturaMatriz />
                </RutaProtegida>
              }
            />

            <Route
              path="/consumo"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <VerConsumo />
                </RutaProtegida>
              }
            />
            <Route
              path="/tarifas"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <ListarTarifas />
                </RutaProtegida>
              }
            />
            <Route
              path="/tarifas/nueva"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <CrearTarifa />
                </RutaProtegida>
              }
            />
            <Route
              path="/resumen"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <ResumenMensual />
                </RutaProtegida>
              }
            />
            <Route
              path="/facturas"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <Facturacion />
                </RutaProtegida>
              }
            />
            <Route
              path="/facturas/:id"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <DetalleFactura />
                </RutaProtegida>
              }
            />
            <Route
              path="/pagos"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <RegistrarPago />
                </RutaProtegida>
              }
            />
            <Route
              path="/caja"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <MiCaja />
                </RutaProtegida>
              }
            />
            <Route
              path="/caja/:id"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <DetalleCaja />
                </RutaProtegida>
              }
            />

            <Route
              path="/reportes"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <ReportesIndex />
                </RutaProtegida>
              }
            />
            <Route
              path="/reportes/presion"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <ReportePresion />
                </RutaProtegida>
              }
            />
            <Route
              path="/reportes/facturacion"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <ReporteFacturacion />
                </RutaProtegida>
              }
            />
            <Route
              path="/reportes/continuidad"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <ReporteContinuidad />
                </RutaProtegida>
              }
            />
            <Route
              path="/reportes/reclamos"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <ReporteReclamos />
                </RutaProtegida>
              }
            />

            {/* Reclamos: listar abierto a los 3 (terreno lo usa como select en presión); crear/detalle restringidos */}
            <Route
              path="/reclamos"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <ListarReclamos />
                </RutaProtegida>
              }
            />
            <Route
              path="/reclamos/nuevo"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <RegistrarReclamo />
                </RutaProtegida>
              }
            />
            <Route
              path="/reclamos/:id"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <DetalleReclamo />
                </RutaProtegida>
              }
            />
            <Route
              path="/reclamos/:id/editar"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <EditarReclamo />
                </RutaProtegida>
              }
            />

            <Route
              path="/configuracion"
              element={
                <RutaProtegida rolesPermitidos={["admin", "super_admin"]}>
                  <Configuracion />
                </RutaProtegida>
              }
            />
            <Route
              path="/usuarios"
              element={
                <RutaProtegida rolesPermitidos={["admin", "super_admin"]}>
                  <ListarUsuarios />
                </RutaProtegida>
              }
            />
            <Route
              path="/usuarios/nuevo"
              element={
                <RutaProtegida rolesPermitidos={["admin", "super_admin"]}>
                  <RegistrarUsuario />
                </RutaProtegida>
              }
            />
            <Route
              path="/usuarios/:id/editar"
              element={
                <RutaProtegida rolesPermitidos={["admin", "super_admin"]}>
                  <EditarUsuario />
                </RutaProtegida>
              }
            />
            <Route
              path="/cajas-empresa"
              element={
                <RutaProtegida rolesPermitidos={["admin"]}>
                  <GestionCajas />
                </RutaProtegida>
              }
            />
            <Route
              path="/empresas/nueva"
              element={
                <RutaProtegida rolesPermitidos={["super_admin"]}>
                  <CrearEmpresa />
                </RutaProtegida>
              }
            />

            <Route
              path="/reportes-internos"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <ReportesInternos />
                </RutaProtegida>
              }
            />
            <Route
              path="/reportes-internos/agua-no-facturada"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <ComparativaAgua />
                </RutaProtegida>
              }
            />
            <Route
              path="/reportes-internos/clientes-subsidio"
              element={
                <RutaProtegida rolesPermitidos={["admin", "oficina"]}>
                  <ReporteClientesSubsidio />
                </RutaProtegida>
              }
            />
            <Route
              path="/reportes-internos/pagos"
              element={
                <RutaProtegida rolesPermitidos={["admin"]}>
                  <ReportePagos />
                </RutaProtegida>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

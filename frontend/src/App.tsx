import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import RegistrarCliente from "./pages/RegistrarCliente";
import ListarClientes from "./pages/ListarClientes";
import DetalleCliente from "./pages/DetalleCliente";
import EditarCliente from "./pages/EditarCliente";
import IngresarLectura from "./pages/IngresarLectura";
import VerConsumo from "./pages/VerConsumo";
import ListarTarifas from "./pages/ListarTarifas";
import CrearTarifa from "./pages/CrearTarifa";
import ResumenMensual from "./pages/ResumenMensual";
import HistorialLecturas from "./pages/HistorialLecturas";
import RutaLectura from "./pages/RutaLectura";
import ReportesIndex from "./pages/ReportesIndex";
import ReporteFacturacion from "./pages/ReporteFacturacion";
import RegistrarPresion from "./pages/RegistrarPresion";
import ReportePresion from "./pages/ReportePresion";
import RegistrarCorte from "./pages/RegistrarCorte";
import ReporteContinuidad from "./pages/ReporteContinuidad";
import ListarReclamos from "./pages/ListarReclamos";
import RegistrarReclamo from "./pages/RegistrarReclamo";
import DetalleReclamo from "./pages/DetalleReclamo";
import ReporteReclamos from "./pages/ReporteReclamos";
import Dashboard from "./pages/Dashboard";
import Facturacion from "./pages/Facturacion";
import RegistrarPago from "./pages/RegistrarPago";
import Configuracion from "./pages/Configuracion";
import DetalleFactura from "./pages/DetalleFactura";
import RegistrarLecturaMatriz from "./pages/RegistrarLecturaMatriz";
import ReportesInternos from "./pages/ReportesInternos";
import ComparativaAgua from "./pages/ComparativaAgua";
import HistorialLecturaMatriz from "./pages/HistorialLecturaMatriz";
import Login from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";
import RutaProtegida from "./components/RutaProtegida";
import GestionUsuarios from "./pages/GestionUsuarios";
import CrearEmpresa from "./pages/CrearEmpresa";
import MiPerfil from "./pages/MiPerfil";
import ReporteClientesSubsidio from "./pages/ReporteClientesSubsidio";
import MiCaja from "./pages/MiCaja";
import DetalleCaja from "./pages/DetalleCaja";
import GestionCajas from "./pages/GestionCajas";
import ReportePagos from "./pages/ReportePagos";

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
                  <GestionUsuarios />
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

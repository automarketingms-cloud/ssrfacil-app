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
            <Route path="/clientes" element={<ListarClientes />} />
            <Route path="/clientes/nuevo" element={<RegistrarCliente />} />
            <Route path="/clientes/:id" element={<DetalleCliente />} />
            <Route path="/clientes/:id/editar" element={<EditarCliente />} />
            <Route path="/lecturas" element={<IngresarLectura />} />
            <Route path="/lecturas/historial" element={<HistorialLecturas />} />
            <Route path="/lecturas/ruta" element={<RutaLectura />} />
            <Route
              path="/lectura-matriz/historial"
              element={<HistorialLecturaMatriz />}
            />
            <Route path="/consumo" element={<VerConsumo />} />
            <Route path="/tarifas" element={<ListarTarifas />} />
            <Route path="/tarifas/nueva" element={<CrearTarifa />} />
            <Route path="/resumen" element={<ResumenMensual />} />
            <Route path="/facturas" element={<Facturacion />} />
            <Route path="/facturas/:id" element={<DetalleFactura />} />
            <Route path="/pagos" element={<RegistrarPago />} />
            <Route path="/reportes" element={<ReportesIndex />} />
            <Route path="/presion" element={<RegistrarPresion />} />
            <Route path="/reportes/presion" element={<ReportePresion />} />
            <Route
              path="/reportes/facturacion"
              element={<ReporteFacturacion />}
            />
            <Route path="/continuidad" element={<RegistrarCorte />} />
            <Route
              path="/reportes/continuidad"
              element={<ReporteContinuidad />}
            />
            <Route path="/reclamos" element={<ListarReclamos />} />
            <Route path="/reclamos/nuevo" element={<RegistrarReclamo />} />
            <Route path="/reclamos/:id" element={<DetalleReclamo />} />
            <Route path="/reportes/reclamos" element={<ReporteReclamos />} />
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
              path="/empresas/nueva"
              element={
                <RutaProtegida rolesPermitidos={["super_admin"]}>
                  <CrearEmpresa />
                </RutaProtegida>
              }
            />
            <Route
              path="/lectura-matriz"
              element={<RegistrarLecturaMatriz />}
            />
            <Route path="/reportes-internos" element={<ReportesInternos />} />
            <Route
              path="/reportes-internos/agua-no-facturada"
              element={<ComparativaAgua />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

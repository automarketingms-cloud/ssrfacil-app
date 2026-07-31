import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/clientes" replace />} />
          <Route path="/clientes" element={<ListarClientes />} />
          <Route path="/clientes/nuevo" element={<RegistrarCliente />} />
          <Route path="/clientes/:id" element={<DetalleCliente />} />
          <Route path="/clientes/:id/editar" element={<EditarCliente />} />
          <Route path="/lecturas" element={<IngresarLectura />} />
          <Route path="/lecturas/historial" element={<HistorialLecturas />} />
          <Route path="/consumo" element={<VerConsumo />} />
          <Route path="/tarifas" element={<ListarTarifas />} />
          <Route path="/tarifas/nueva" element={<CrearTarifa />} />
          <Route path="/resumen" element={<ResumenMensual />} />
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

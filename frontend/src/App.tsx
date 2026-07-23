import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import RegistrarCliente from "./pages/RegistrarCliente";
import ListarClientes from "./pages/ListarClientes";
import IngresarLectura from "./pages/IngresarLectura";
import VerConsumo from "./pages/VerConsumo";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/clientes" replace />} />
          <Route path="/clientes" element={<ListarClientes />} />
          <Route path="/clientes/nuevo" element={<RegistrarCliente />} />
          <Route path="/lecturas" element={<IngresarLectura />} />
          <Route path="/consumo" element={<VerConsumo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

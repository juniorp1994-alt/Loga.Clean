import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import * as XLSX from "xlsx";

/*
VERSÃO 3 – Sistema Corporativo de Gestão de Isotanques
Atualização visual:
- Novo tema de cores
- Suporte para LOGO 3D
*/

const COLORS = {
  primary: "#1F3A33", // verde corporativo mais escuro
  secondary: "#6B7280", // cinza moderno
  background: "#F3F4F6",
  card: "#FFFFFF"
};

// PWA helper para permitir instalar como APP no iPhone (Adicionar à Tela de Início)
function InstallAppBanner(){
  const [ios,setIos]=React.useState(false);
  const [show,setShow]=React.useState(false);

  React.useEffect(()=>{
    const ua=window.navigator.userAgent.toLowerCase();
    const isIos=/iphone|ipad|ipod/.test(ua);
    const isStandalone=window.navigator.standalone===true;

    if(isIos && !isStandalone){
      setIos(true);
      setShow(true);
    }
  },[]);

  if(!show || !ios) return null;

  return (
    <>
    <InstallAppBanner />
    <div style={{background:'#1F3A33',color:'white',padding:10,borderRadius:8}}>
      📱 Instalar App: toque em <b>Compartilhar</b> no Safari e depois <b>"Adicionar à Tela de Início"</b>.
    </div>
      </>
  );
}

export default function IsoTankSystemV3() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [history, setHistory] = useState([]);

  const login = () => {
    if (email && password) {
      setUser({ email });
    }
  };

  const logout = () => {
    setUser(null);
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const normalized = json.map((r) => ({
        ...r,
        "DATA ENTRADA": r["DATA ENTRADA"] ? new Date(r["DATA ENTRADA"]) : null,
        "VALOR ESTIMADO": Number(r["VALOR ESTIMADO"]) || 0,
        "VALOR APROVADO": Number(r["VALOR APROVADO"]) || 0,
      }));

      setData(normalized);
      setFiltered(normalized);

      setHistory((h) => [
        ...h,
        {
          date: new Date().toLocaleString(),
          registros: normalized.length,
        },
      ]);
    };

    reader.readAsBinaryString(file);
  };

  const applyFilter = () => {
    if (!startDate || !endDate) {
      setFiltered(data);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const f = data.filter((r) => {
      const d = r["DATA ENTRADA"];
      if (!d) return false;
      return d >= start && d <= end;
    });

    setFiltered(f);
  };

  const totalEstimado = useMemo(
    () => filtered.reduce((a, b) => a + b["VALOR ESTIMADO"], 0),
    [filtered]
  );

  const totalAprovado = useMemo(
    () => filtered.reduce((a, b) => a + b["VALOR APROVADO"], 0),
    [filtered]
  );

  const taxaAprovacao = totalEstimado
    ? ((totalAprovado / totalEstimado) * 100).toFixed(1)
    : 0;

  const ticketMedio = filtered.length
    ? (totalAprovado / filtered.length).toFixed(2)
    : 0;

  const topServicos = useMemo(() => {
    const map = {};

    filtered.forEach((r) => {
      const s = r["SERVIÇOS"];
      if (!s) return;
      map[s] = (map[s] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }, [filtered]);

  const produtividade = useMemo(() => {
    const map = {};

    filtered.forEach((r) => {
      const c = r["COLABORADOR"];
      if (!c) return;
      map[c] = (map[c] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const clientesTop = useMemo(() => {
    const map = {};

    filtered.forEach((r) => {
      const c = r["CLIENTE"];
      if (!c) return;

      map[c] = (map[c] || 0) + r["VALOR APROVADO"];
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filtered]);

  const forecast = useMemo(() => {
    const meses = {};

    filtered.forEach((r) => {
      if (!r["DATA ENTRADA"]) return;

      const m = r["DATA ENTRADA"].getMonth() + 1;
      meses[m] = (meses[m] || 0) + r["VALOR APROVADO"];
    });

    return Object.entries(meses).map(([m, v]) => ({
      name: `M${m}`,
      value: v,
    }));
  }, [filtered]);

  const isotanks = useMemo(() => {
    const map = {};

    filtered.forEach((r) => {
      const iso = r["ISOTANK"];
      if (!iso) return;

      map[iso] = (map[iso] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  if (!user) {
    return (
      <div className="p-10 max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Login Loga Clean</h1>

        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          placeholder="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button onClick={login}>Entrar</Button>
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6"
      style={{ background: COLORS.background, minHeight: "100vh" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* COLOQUE AQUI O LOGO 3D */}
          <img
            src="/logaclean_logo.png"
            alt="Logo"
            className="h-16"
          />

          <h1
            className="text-3xl font-bold"
            style={{ color: COLORS.primary }}
          >
            Loga Clean
          </h1>
        </div>

        <Button onClick={logout}>Sair</Button>
      </div>

      <Card style={{ background: COLORS.card }}>
        <CardContent className="p-4 space-y-4">
          <input type="file" accept=".xlsx,.xls" onChange={handleUpload} />

          <div className="flex gap-3">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Button onClick={applyFilter}>Filtrar</Button>
            <Button onClick={() => setFiltered(data)}>Limpar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <h2>Total Estimado</h2>
            <p className="text-xl font-bold">R$ {totalEstimado.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2>Total Aprovado</h2>
            <p className="text-xl font-bold">R$ {totalAprovado.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2>Taxa Aprovação</h2>
            <p className="text-xl font-bold">{taxaAprovacao}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2>Ticket Médio</h2>
            <p className="text-xl font-bold">R$ {ticketMedio}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-bold mb-4">Top 3 Reparos</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topServicos}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-bold mb-4">Produtividade Colaboradores</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={produtividade}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-bold mb-4">Top Clientes</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={clientesTop}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.secondary} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-bold mb-4">Previsão de Faturamento</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={forecast}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line dataKey="value" stroke={COLORS.primary} strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-bold mb-4">Isotanques Processados</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {isotanks.map((iso) => (
              <div key={iso.name} className="bg-white p-2 rounded shadow">
                {iso.name} ({iso.value})
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-bold mb-4">Histórico de Upload</h2>

          {history.map((h, i) => (
            <div key={i} className="text-sm">
              {h.date} - {h.registros} registros
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

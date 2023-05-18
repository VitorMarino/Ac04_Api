import React, { useReducer, useState } from "react";
import axios from "axios";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

// instância do axios com a baseURL definida para a API do Mercado Pago
const api = axios.create({
  baseURL: "https://api.mercadopago.com",
});

// Intercepta as requisições e adiciona o token de acesso
api.interceptors.request.use(async (config) => {
  // Token de acesso
  const token =
    "";
  config.headers.Authorization = `Bearer ${token}`;

  return config;
});

// Reducer para atualizar o estado do formulário
const formReducer = (state, event) => {
  return {
    ...state,
    [event.name]: event.value,
  };
};

function App() {
  // Estados para guardar os dados
  const [formData, setFormdata] = useReducer(formReducer, {});
  const [responsePayment, setResponsePayment] = useState(false);
  const [linkBuyMercadoPago, setLinkBuyMercadoPago] = useState(false);
  const [statusPayment, setStatusPayment] = useState(false);
  const [error, setError] = useState(null);

  // Função chamada quando há alteração em algum campo do formulário
  const handleChange = (event) => {
    setFormdata({
      name: event.target.name,
      value: event.target.value,
    });
  };

  // Função para validar o formulário antes de fazer o pagamento
  const validateForm = () => {
    // Verificar se o CPF existe
    if (!formData.cpf) {
      setError("CPF é obrigatório");
      return false;
    }

    // Verificar se o email é válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Email inválido");
      return false;
    }

    // Verificar se não há números no nome e sobrenome
    const nameRegex = /^[A-Za-z\s]+$/;
    if (
      !nameRegex.test(formData.nome) ||
      !nameRegex.test(formData.sobrenome)
    ) {
      setError("Nome e sobrenome não devem conter números");
      return false;
    }

    // Verificar se o valor é um número válido
    const valueRegex = /^\d+(\.\d{1,2})?$/;
    if (!valueRegex.test(formData.valor)) {
      setError("Valor inválido");
      return false;
    }

    // Formulário válido
    setError(null);
    return true;
  };

  // Função chamada ao submeter o formulário
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const body = {
      transaction_amount: parseFloat(formData.valor),
      payment_method_id: "pix",
      payer: {
        email: formData.email,
        first_name: formData.nome,
        last_name: formData.sobrenome,
        identification: {
          type: "CPF",
          number: formData.cpf,
        },
      },
      notification_url: "https://eoamd6xoalf3p7z.m.pipedream.net",
    };

    // Faz uma requisição POST para criar um pagamento
    api
      .post("v1/payments", body)
      .then((response) => {
        setResponsePayment(response);
        setLinkBuyMercadoPago(
          response.data.point_of_interaction.transaction_data.ticket_url
        );
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  // Função para verificar o status do pagamento
  const getStatusPayment = () => {
    api
      .get(`v1/payments/${responsePayment.data.id}`)
      .then((response) => {
        if (response.data.status === "approved") {
          setStatusPayment(true);
        } else {
          setStatusPayment(false);
          alert("O pagamento está pendente");
        }
      })
      .catch((err) => {
        alert(err);
      });
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="container">
          {!responsePayment && (
            <h1 className="text-center">PIX com API do Mercado Pago</h1>
          )}

          {error && <p className="error">{error}</p>}

          {!responsePayment && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  E-mail
                </label>
                <input
                  onChange={handleChange}
                  name="email"
                  type="email"
                  className="form-control"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="nome" className="form-label">
                  Nome
                </label>
                <input
                  onChange={handleChange}
                  name="nome"
                  pattern="[A-Za-z\s]+"
                  title="Nome não deve conter números"
                  className="form-control"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="sobrenome" className="form-label">
                  Sobrenome
                </label>
                <input
                  onChange={handleChange}
                  name="sobrenome"
                  pattern="[A-Za-z\s]+"
                  title="Sobrenome não deve conter números"
                  className="form-control"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="cpf" className="form-label">
                  CPF
                </label>
                <input
                  onChange={handleChange}
                  name="cpf"
                  pattern="[0-9]{11}"
                  title="CPF deve conter 11 dígitos numéricos"
                  className="form-control"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="valor" className="form-label">
                  Valor da Doação
                </label>
                <input
                  onChange={handleChange}
                  name="valor"
                  type="text"
                  className="form-control"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Pagar
              </button>
            </form>
          )}

          {responsePayment && (
            <div>
              <div className="d-flex justify-content-center mt-3">
                {responsePayment && !statusPayment && (
                  <button onClick={getStatusPayment} className="btn btn-primary">
                    Verificar status do pagamento
                  </button>
                )}
              </div>
              <br />

              {linkBuyMercadoPago && !statusPayment && (
                <iframe
                  src={linkBuyMercadoPago}
                  width="400px"
                  height="620px"
                  title="link_buy"
                />
              )}

              {statusPayment && (
                <div>
                  <h1>Compra aprovada</h1>
                  {responsePayment && (
                    <iframe
                      src={
                        responsePayment.data.transaction_details
                          .external_resource_url
                      }
                      width="400px"
                      height="620px"
                      title="payment_status"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;

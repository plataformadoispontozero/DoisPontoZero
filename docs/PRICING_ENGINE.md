# DOIS.ZERO — PRICING ENGINE (FASE 08)

## Visão Geral
O **Pricing Engine** é o motor de precificação financeira do Proposal Studio. Ele opera exclusivamente com aritmética inteira em centavos (`BIGINT`), garantindo que não ocorram erros de arredondamento de ponto flutuante em propostas comerciais.

---

## Regras Financeiras

1. **Unidade Mínima de Moeda**:
   Todos os valores em tabela (`unit_price_cents`, `discount_cents`, `subtotal_cents`, `total_cents`, `one_time_total_cents`, `recurring_monthly_total_cents`) são armazenados em centavos inteiros (R$ 10,00 = `1000`).

2. **Separação de Compromissos**:
   - **Investimento Pontual (`one_time`)**: Valor cobrado em taxa única/setup.
   - **Investimento Recorrente (`recurring`)**: Valor de mensalidade ou honorário recorrente.
   - **Itens Opcionais (`optional`)**: Não somados ao total principal ativo.

3. **Cálculo de Totais**:
   $$\text{Item Total} = \max\left(0, \lfloor\text{quantidade} \times \text{unit\_price\_cents}\rfloor - \text{discount\_cents}\right)$$
   $$\text{Subtotal} = \sum \text{Item Totais (Não Opcionais)}$$
   $$\text{Total} = \max\left(0, \text{Subtotal} - \text{Desconto Global} + \text{Taxas}\right)$$

4. **Validação**:
   Os totais são recalculados no backend e validados por regras de integridade, impedindo totais negativos ou manipulação via cliente.

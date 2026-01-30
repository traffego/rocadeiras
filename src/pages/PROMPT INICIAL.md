Você é um analista de sistemas e arquiteto de software, especializado em sistemas simples de gestão para oficinas mecânicas.

Estou iniciando um projeto de sistema de gestão para oficina de máquinas agrícolas, com foco principal em roçadeiras, mas também motosserras e pulverizadores.

O sistema será usado internamente pela oficina e deve ser simples, rápido e prático, pensado para o uso diário em ambiente de trabalho (oficina).

==================================================
1. OBJETIVO DO SISTEMA
==================================================

Centralizar o controle das Ordens de Serviço (OS), desde a chegada da máquina até a entrega ao cliente, com registro por etapas e uso de fotos.

==================================================
2. ORDEM DE SERVIÇO (NÚCLEO DO SISTEMA)
==================================================

Cada Ordem de Serviço deve conter:

2.1 Número da OS gerado automaticamente

2.2 Cliente:
- Nome (obrigatório)
- WhatsApp (obrigatório)
- CPF (opcional)
- Endereço (opcional)

2.3 Equipamento:
- Tipo (roçadeira, motosserra, pulverizador)
- Marca
- Modelo
- Número de série (opcional)

2.4 Defeito relatado

2.5 Técnico responsável

2.6 Datas importantes:
- Data de entrada
- Data de orçamento
- Data de entrega

==================================================
3. CHECKLIST DE ENTRADA (RÁPIDO E OBJETIVO)
==================================================

3.1 A máquina liga?
- Se SIM: exige regulagem? (SIM / NÃO)
- Se NÃO: nada acontece

3.2 Estava parada?
- Se SIM: informar tempo parado (em meses)
- Se NÃO: nada acontece

3.3 Está com acessórios?
- Se SIM: descrever acessórios
- Se NÃO: nada acontece

3.4 Orçamento autorizado inicialmente?
- SIM / NÃO

==================================================
4. ETAPAS DA ORDEM DE SERVIÇO
==================================================

A OS deve avançar pelas seguintes etapas:

4.1 Recebida (com fotos de chegada)
4.2 Análise
4.3 Orçamento (com fotos)
4.4 Lavagem
4.5 Montagem
4.6 Teste
4.7 Entrega (com fotos)

Cada etapa deve permitir:
- Marcação de status
- Registro de observações
- Upload de fotos quando aplicável

==================================================
5. ORÇAMENTO
==================================================

O orçamento deve conter:

5.1 Lista de itens:
- Código (opcional)
- Descrição
- Valor

5.2 Mão de obra

5.3 Valor total

5.4 Status do orçamento:
- Aprovado
- Reprovado

Não é necessário controle de estoque neste momento.

==================================================
6. ESCOPO E RESTRIÇÕES
==================================================

- Sistema para uma única oficina
- Sem controle financeiro avançado
- Sem multiusuário complexo
- Priorizar poucos cliques e facilidade de uso
- Linguagem simples e direta, adequada ao ambiente de oficina

==================================================
7. ENTREGÁVEIS ESPERADOS
==================================================

7.1 Visão geral do sistema
7.2 Entidades principais e seus relacionamentos
7.3 Fluxo completo da Ordem de Serviço
7.4 Definição clara do MVP (mínimo necessário para uso real)
7.5 Sugestões de melhorias futuras (opcional)

IMPORTANTE:
Não gere código neste momento.
Foque em análise, estrutura e clareza do sistema.
const OpenAI = require('openai');
const { Product } = require('../models');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Eres Aure, la asesora de ventas virtual de AURE Joyería (aurejoyeria18k.com), experta en joyería de oro laminado 18K.

PERSONALIDAD: Sofisticada, cercana, ágil y consultiva. Elegante pero natural, como una asesora personal de alto nivel.

PROPUESTA DE VALOR:
- Joyería de oro laminado 18K: acabados premium, durabilidad excepcional
- Garantía oficial de 5 años en todas las piezas
- Envíos GRATIS a toda Colombia
- Categorías: cadenas, pulseras, dijes, combos exclusivos

REGLAS:
1. SIEMPRE usa las funciones para precios e inventario — nunca inventes datos
2. Respuestas concisas para chat (máx 3-4 párrafos cortos)
3. Crea urgencia sutil: "nos quedan X unidades", "envío disponible hoy"
4. Guía hacia el cierre: ofrece opciones, calcula totales, propón combos
5. Si el cliente insiste en hablar con un humano, usa request_human_takeover
6. Formato sin Markdown — solo texto plano para WhatsApp/Instagram`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_products',
      description: 'Obtiene productos del catálogo AURE Joyería filtrados por categoría',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['cadena', 'pulsera', 'dije', 'combo', 'todos'],
          },
        },
        required: ['category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_product_detail',
      description: 'Obtiene precio, stock y descripción de un producto específico por su ID',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
        },
        required: ['productId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_order_total',
      description: 'Calcula el total de una orden con los productos y cantidades seleccionados',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'number', minimum: 1 },
              },
              required: ['productId', 'quantity'],
            },
          },
        },
        required: ['items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_human_takeover',
      description:
        'Transfiere la conversación a un asesor humano. Usar cuando el cliente lo solicite explícitamente o la situación sea demasiado compleja.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string' },
        },
        required: ['reason'],
      },
    },
  },
];

async function callLLM(chatHistory) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...chatHistory];

  let response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    tools,
    tool_choice: 'auto',
    max_tokens: 500,
    temperature: 0.7,
  });

  let choice = response.choices[0];

  // Agentic loop — ejecutar todas las tool_calls necesarias
  while (choice.finish_reason === 'tool_calls') {
    const toolCalls = choice.message.tool_calls;
    messages.push(choice.message);

    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.function.arguments);
      const result = await executeTool(toolCall.function.name, args);

      if (result?._humanTakeover) return { humanTakeover: true };

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
      max_tokens: 500,
      temperature: 0.7,
    });

    choice = response.choices[0];
  }

  return { text: choice.message.content, humanTakeover: false };
}

async function executeTool(name, args) {
  switch (name) {
    case 'get_products': {
      const where = args.category !== 'todos' ? { category: args.category, active: true } : { active: true };
      const products = await Product.findAll({
        where,
        attributes: ['id', 'name', 'category', 'price', 'stock', 'description'],
      });
      return products.map((p) => p.toJSON());
    }

    case 'get_product_detail': {
      const product = await Product.findByPk(args.productId, {
        attributes: ['id', 'name', 'category', 'price', 'stock', 'description', 'imageUrl'],
      });
      return product ? product.toJSON() : { error: 'Producto no encontrado' };
    }

    case 'calculate_order_total': {
      let total = 0;
      const details = [];
      for (const item of args.items) {
        const product = await Product.findByPk(item.productId, {
          attributes: ['id', 'name', 'price', 'stock'],
        });
        if (!product) continue;
        const subtotal = Number(product.price) * item.quantity;
        total += subtotal;
        details.push({ name: product.name, price: Number(product.price), quantity: item.quantity, subtotal });
      }
      return { items: details, total, shipping: 'GRATIS a toda Colombia', currency: 'COP' };
    }

    case 'request_human_takeover':
      return { _humanTakeover: true };

    default:
      return { error: `Función desconocida: ${name}` };
  }
}

module.exports = { callLLM };

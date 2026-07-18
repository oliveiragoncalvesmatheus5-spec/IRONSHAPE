export type UiLanguage = 'pt-BR' | 'en' | 'es';

const EXACT: Record<Exclude<UiLanguage, 'pt-BR'>, Record<string, string>> = {
  en: {
    'Configuração Necessária': 'Configuration Required',
    'As chaves do Supabase não foram encontradas. Se você estiver usando o Netlify, adicione as seguintes variáveis de ambiente nas configurações do site:': 'The Supabase keys were not found. If you are using Netlify, add the following environment variables in the site settings:',
    'Após adicionar as variáveis, faça um novo deploy ou reinicie o servidor.': 'After adding the variables, deploy again or restart the server.',
    'Ops! Algo deu errado': 'Oops! Something went wrong',
    'A conexão com o servidor demorou muito. Verifique sua internet.': 'The server connection took too long. Check your internet connection.',
    'Tentar Novamente': 'Try Again',
    'Recarregar Página': 'Reload Page',
    'Limpar Cache e Sair': 'Clear Cache and Log Out',
    'A IronShop está chegando!': 'IronShop is coming soon!',
    'Em breve, você poderá encontrar suplementos, roupas e acessórios selecionados para ajudar na sua evolução.': 'Soon you will find selected supplements, apparel, and accessories to support your progress.',
    'Entendi': 'Got it',
    'Loja IronShape': 'IronShape Shop',
    'Prévia interna com produtos selecionados para testes de permissão, estoque e vitrine antes da liberação pública.': 'Internal preview with selected products to test permissions, inventory, and storefront before public release.',
    'Carregando vitrine protegida...': 'Loading protected storefront...',
    'Checkout em validação': 'Checkout under validation',
    'Seja um Afiliado': 'Become an Affiliate',
    'Painel do Afiliado': 'Affiliate Dashboard',
    'Gestão de Afiliados': 'Affiliate Management',
    'Detalhes do Afiliado': 'Affiliate Details',
    'Progresso Corporal': 'Body Progress',
    'Acompanhe suas medidas e evolução ao longo do tempo.': 'Track your measurements and progress over time.',
    'Atualizar medidas de hoje': "Update today's measurements",
    'Registrar medidas de hoje': "Log today's measurements",
    'Ocultar medidas corporais': 'Hide body measurements',
    'Adicionar medidas corporais': 'Add body measurements',
    'Medidas Salvas!': 'Measurements Saved!',
    'Salvar Medidas': 'Save Measurements',
    'Sua evolução': 'Your progress',
    'Peso ao longo do tempo': 'Weight over time',
    'Nenhuma medida registrada ainda': 'No measurements logged yet',
    'Registre pelo menos 2 datas para ver o gráfico': 'Log at least 2 dates to see the chart',
    'Registre suas medidas acima para acompanhar sua evolução.': 'Log your measurements above to track your progress.',
    'Última Medição': 'Latest Measurement',
    'Histórico Completo': 'Full History',
    'Comunidade 🤝': 'Community 🤝',
    'Carregando feed...': 'Loading feed...',
    'Tentar novamente': 'Try again',
    'Começar Agora': 'Start Now',
    'Ajustes ⚙️': 'Settings ⚙️',
    'Painel Administrativo': 'Admin Panel',
    'Carregando dados administrativos...': 'Loading admin data...',
    'Usuários': 'Users',
    'Assinaturas': 'Subscriptions',
    'Receita Mês': 'Monthly Revenue',
    'Afiliados Pendentes': 'Pending Affiliates',
    'Treinos': 'Workouts',
    'Dietas': 'Diets',
    'Posts': 'Posts',
    'Afiliados': 'Affiliates',
    'Atualizar': 'Refresh',
    'Fechar': 'Close',
    'Salvar': 'Save',
    'Cancelar': 'Cancel',
    'Confirmar': 'Confirm',
    'Próximo': 'Next',
    'Voltar': 'Back',
    'Começar': 'Start',
    'Carregando...': 'Loading...',
    'Configuração inicial': 'Initial setup',
    'Quantos dias por semana você pode treinar?': 'How many days per week can you train?',
    'Isso define sua frequência semanal ideal.': 'This defines your ideal weekly frequency.',
    'Há quanto tempo você treina?': 'How long have you been training?',
    'Isso ajusta a complexidade das recomendações.': 'This adjusts the complexity of the recommendations.',
    'Você tem alguma limitação física?': 'Do you have any physical limitation?',
    'Selecione todas que se aplicam.': 'Select all that apply.',
    'Quais grupos musculares quer priorizar?': 'Which muscle groups do you want to prioritize?',
    'Selecione até 3.': 'Select up to 3.',
    'Quanto tempo você tem por treino?': 'How much time do you have per workout?',
    'Incluindo aquecimento e alongamento.': 'Including warm-up and stretching.',
    'Pergunte qualquer coisa...': 'Ask anything...',
    'Pensando...': 'Thinking...',
    'Reiniciar configuração': 'Reset setup',
    'Seu personal trainer com IA adaptativa está disponível nos planos': 'Your adaptive AI personal trainer is available on the',
    'Recomendações personalizadas ao seu perfil': 'Recommendations personalized to your profile',
    'Ajusta treinos com base na sua evolução': 'Adjusts workouts based on your progress',
    'Chat ilimitado com seu coach 24/7': 'Unlimited chat with your coach 24/7',
    'Ver planos': 'View plans',
  },
  es: {
    'Configuração Necessária': 'Configuración Necesaria',
    'As chaves do Supabase não foram encontradas. Se você estiver usando o Netlify, adicione as seguintes variáveis de ambiente nas configurações do site:': 'No se encontraron las claves de Supabase. Si usas Netlify, agrega las siguientes variables de entorno en la configuración del sitio:',
    'Após adicionar as variáveis, faça um novo deploy ou reinicie o servidor.': 'Después de agregar las variables, haz un nuevo deploy o reinicia el servidor.',
    'Ops! Algo deu errado': '¡Ups! Algo salió mal',
    'A conexão com o servidor demorou muito. Verifique sua internet.': 'La conexión con el servidor tardó demasiado. Verifica tu internet.',
    'Tentar Novamente': 'Intentar de Nuevo',
    'Recarregar Página': 'Recargar Página',
    'Limpar Cache e Sair': 'Limpiar Caché y Salir',
    'A IronShop está chegando!': '¡IronShop llega pronto!',
    'Em breve, você poderá encontrar suplementos, roupas e acessórios selecionados para ajudar na sua evolução.': 'Pronto podrás encontrar suplementos, ropa y accesorios seleccionados para apoyar tu evolución.',
    'Entendi': 'Entendido',
    'Loja IronShape': 'Tienda IronShape',
    'Prévia interna com produtos selecionados para testes de permissão, estoque e vitrine antes da liberação pública.': 'Vista previa interna con productos seleccionados para probar permisos, stock y vitrina antes del lanzamiento público.',
    'Carregando vitrine protegida...': 'Cargando vitrina protegida...',
    'Checkout em validação': 'Checkout en validación',
    'Seja um Afiliado': 'Sé un Afiliado',
    'Painel do Afiliado': 'Panel del Afiliado',
    'Gestão de Afiliados': 'Gestión de Afiliados',
    'Detalhes do Afiliado': 'Detalles del Afiliado',
    'Progresso Corporal': 'Progreso Corporal',
    'Acompanhe suas medidas e evolução ao longo do tempo.': 'Sigue tus medidas y evolución a lo largo del tiempo.',
    'Atualizar medidas de hoje': 'Actualizar medidas de hoy',
    'Registrar medidas de hoje': 'Registrar medidas de hoy',
    'Ocultar medidas corporais': 'Ocultar medidas corporales',
    'Adicionar medidas corporais': 'Agregar medidas corporales',
    'Medidas Salvas!': '¡Medidas Guardadas!',
    'Salvar Medidas': 'Guardar Medidas',
    'Sua evolução': 'Tu evolución',
    'Peso ao longo do tempo': 'Peso a lo largo del tiempo',
    'Nenhuma medida registrada ainda': 'Aún no hay medidas registradas',
    'Registre pelo menos 2 datas para ver o gráfico': 'Registra al menos 2 fechas para ver el gráfico',
    'Registre suas medidas acima para acompanhar sua evolução.': 'Registra tus medidas arriba para seguir tu evolución.',
    'Última Medição': 'Última Medición',
    'Histórico Completo': 'Historial Completo',
    'Comunidade 🤝': 'Comunidad 🤝',
    'Carregando feed...': 'Cargando feed...',
    'Tentar novamente': 'Intentar de nuevo',
    'Começar Agora': 'Comenzar Ahora',
    'Ajustes ⚙️': 'Ajustes ⚙️',
    'Painel Administrativo': 'Panel Administrativo',
    'Carregando dados administrativos...': 'Cargando datos administrativos...',
    'Usuários': 'Usuarios',
    'Assinaturas': 'Suscripciones',
    'Receita Mês': 'Ingresos del Mes',
    'Afiliados Pendentes': 'Afiliados Pendientes',
    'Treinos': 'Entrenos',
    'Dietas': 'Dietas',
    'Posts': 'Posts',
    'Afiliados': 'Afiliados',
    'Atualizar': 'Actualizar',
    'Fechar': 'Cerrar',
    'Salvar': 'Guardar',
    'Cancelar': 'Cancelar',
    'Confirmar': 'Confirmar',
    'Próximo': 'Siguiente',
    'Voltar': 'Volver',
    'Começar': 'Comenzar',
    'Carregando...': 'Cargando...',
    'Configuração inicial': 'Configuración inicial',
    'Quantos dias por semana você pode treinar?': '¿Cuántos días por semana puedes entrenar?',
    'Isso define sua frequência semanal ideal.': 'Esto define tu frecuencia semanal ideal.',
    'Há quanto tempo você treina?': '¿Hace cuánto tiempo entrenas?',
    'Isso ajusta a complexidade das recomendações.': 'Esto ajusta la complejidad de las recomendaciones.',
    'Você tem alguma limitação física?': '¿Tienes alguna limitación física?',
    'Selecione todas que se aplicam.': 'Selecciona todas las que correspondan.',
    'Quais grupos musculares quer priorizar?': '¿Qué grupos musculares quieres priorizar?',
    'Selecione até 3.': 'Selecciona hasta 3.',
    'Quanto tempo você tem por treino?': '¿Cuánto tiempo tienes por entreno?',
    'Incluindo aquecimento e alongamento.': 'Incluyendo calentamiento y estiramiento.',
    'Pergunte qualquer coisa...': 'Pregunta cualquier cosa...',
    'Pensando...': 'Pensando...',
    'Reiniciar configuração': 'Reiniciar configuración',
    'Seu personal trainer com IA adaptativa está disponível nos planos': 'Tu entrenador personal con IA adaptativa está disponible en los planes',
    'Recomendações personalizadas ao seu perfil': 'Recomendaciones personalizadas para tu perfil',
    'Ajusta treinos com base na sua evolução': 'Ajusta entrenos con base en tu evolución',
    'Chat ilimitado com seu coach 24/7': 'Chat ilimitado con tu coach 24/7',
    'Ver planos': 'Ver planes',
  },
};

const TERMS: Record<Exclude<UiLanguage, 'pt-BR'>, Array<[RegExp, string]>> = {
  en: [
    [/\bInício\b/g, 'Home'],
    [/\bTreinos?\b/g, 'Workouts'],
    [/\bTreino\b/g, 'Workout'],
    [/\bDieta\b/g, 'Diet'],
    [/\bNutrição\b/g, 'Nutrition'],
    [/\bProgresso\b/g, 'Progress'],
    [/\bComunidade\b/g, 'Community'],
    [/\bLoja\b/g, 'Shop'],
    [/\bAfiliados?\b/g, 'Affiliates'],
    [/\bAjustes\b/g, 'Settings'],
    [/\bPlanos\b/g, 'Plans'],
    [/\bSair\b/g, 'Log out'],
    [/\bMais opções\b/g, 'More options'],
    [/\bAcessos secundários e configurações\b/g, 'Secondary access and settings'],
    [/\bSuplemento\b/g, 'Supplement'],
    [/\bRoupa\b/g, 'Apparel'],
    [/\bAcessório\b/g, 'Accessory'],
    [/\bem estoque\b/g, 'in stock'],
    [/\bAcesso público\b/g, 'Public access'],
    [/\bAcesso admin\b/g, 'Admin access'],
    [/\bacesso antecipado\b/g, 'early access'],
    [/\bPeso\b/g, 'Weight'],
    [/\bGordura\b/g, 'Fat'],
    [/\bCintura\b/g, 'Waist'],
    [/\bQuadril\b/g, 'Hips'],
    [/\bPeito\b/g, 'Chest'],
    [/\bBraço\b/g, 'Arm'],
    [/\bCoxa\b/g, 'Thigh'],
    [/\bPanturrilha\b/g, 'Calf'],
    [/\bData\b/g, 'Date'],
    [/\bHoje\b/g, 'Today'],
    [/\bMeta\b/g, 'Goal'],
    [/\bPontos\b/g, 'Points'],
    [/\bHistórico\b/g, 'History'],
    [/\bRegistro\b/g, 'Log'],
    [/\bSalvar\b/g, 'Save'],
    [/\bSalvo\b/g, 'Saved'],
    [/\bAdicionar\b/g, 'Add'],
    [/\bRemover\b/g, 'Remove'],
    [/\bEditar\b/g, 'Edit'],
    [/\bExcluir\b/g, 'Delete'],
    [/\bBuscar\b/g, 'Search'],
    [/\bPublicar\b/g, 'Post'],
    [/\bPublicado\b/g, 'Posted'],
    [/\bUsuários\b/g, 'Users'],
    [/\bUsuário\b/g, 'User'],
    [/\bAssinaturas\b/g, 'Subscriptions'],
    [/\bassinaturas ativas\b/g, 'active subscriptions'],
    [/\bativos hoje\b/g, 'active today'],
    [/\bda base\b/g, 'of the base'],
    [/\bno total\b/g, 'total'],
    [/\bÚltima atividade\b/g, 'Last activity'],
    [/\bCadastro\b/g, 'Registration'],
    [/\bObjetivo\b/g, 'Goal'],
    [/\bCorpo\b/g, 'Body'],
    [/\bAssinatura\b/g, 'Subscription'],
    [/\bNão informado\b/g, 'Not provided'],
    [/\bNão detectada\b/g, 'Not detected'],
    [/\bDados incompletos\b/g, 'Incomplete data'],
    [/\bCadastrado em\b/g, 'Registered on'],
    [/\bàs\b/g, 'at'],
    [/\bdias\/semana\b/g, 'days/week'],
    [/\bdias\b/g, 'days'],
    [/\bdia\b/g, 'day'],
    [/\bMenos de\b/g, 'Less than'],
    [/\bMais de\b/g, 'More than'],
    [/\bmeses\b/g, 'months'],
    [/\banos\b/g, 'years'],
    [/\bNenhuma\b/g, 'None'],
    [/\bCostas\b/g, 'Back'],
    [/\bPernas\b/g, 'Legs'],
    [/\bOmbros\b/g, 'Shoulders'],
    [/\bBraços\b/g, 'Arms'],
    [/\bAbdômen\b/g, 'Core'],
    [/\bAlongamento\b/g, 'Stretching'],
    [/\bAquecimento\b/g, 'Warm-up'],
    [/\bVer\b/g, 'View'],
    [/\bAbrir\b/g, 'Open'],
    [/\bFazer upgrade\b/g, 'Upgrade'],
    [/\bPlano Atual\b/g, 'Current Plan'],
    [/\bComeçar Grátis\b/g, 'Start Free'],
  ],
  es: [
    [/\bInício\b/g, 'Inicio'],
    [/\bTreinos?\b/g, 'Entrenos'],
    [/\bTreino\b/g, 'Entreno'],
    [/\bDieta\b/g, 'Dieta'],
    [/\bNutrição\b/g, 'Nutrición'],
    [/\bProgresso\b/g, 'Progreso'],
    [/\bComunidade\b/g, 'Comunidad'],
    [/\bLoja\b/g, 'Tienda'],
    [/\bAfiliados?\b/g, 'Afiliados'],
    [/\bAjustes\b/g, 'Ajustes'],
    [/\bPlanos\b/g, 'Planes'],
    [/\bSair\b/g, 'Salir'],
    [/\bMais opções\b/g, 'Más opciones'],
    [/\bAcessos secundários e configurações\b/g, 'Accesos secundarios y configuración'],
    [/\bSuplemento\b/g, 'Suplemento'],
    [/\bRoupa\b/g, 'Ropa'],
    [/\bAcessório\b/g, 'Accesorio'],
    [/\bem estoque\b/g, 'en stock'],
    [/\bAcesso público\b/g, 'Acceso público'],
    [/\bAcesso admin\b/g, 'Acceso admin'],
    [/\bacesso antecipado\b/g, 'acceso anticipado'],
    [/\bPeso\b/g, 'Peso'],
    [/\bGordura\b/g, 'Grasa'],
    [/\bCintura\b/g, 'Cintura'],
    [/\bQuadril\b/g, 'Cadera'],
    [/\bPeito\b/g, 'Pecho'],
    [/\bBraço\b/g, 'Brazo'],
    [/\bCoxa\b/g, 'Muslo'],
    [/\bPanturrilha\b/g, 'Pantorrilla'],
    [/\bData\b/g, 'Fecha'],
    [/\bHoje\b/g, 'Hoy'],
    [/\bMeta\b/g, 'Meta'],
    [/\bPontos\b/g, 'Puntos'],
    [/\bHistórico\b/g, 'Historial'],
    [/\bRegistro\b/g, 'Registro'],
    [/\bSalvar\b/g, 'Guardar'],
    [/\bSalvo\b/g, 'Guardado'],
    [/\bAdicionar\b/g, 'Agregar'],
    [/\bRemover\b/g, 'Eliminar'],
    [/\bEditar\b/g, 'Editar'],
    [/\bExcluir\b/g, 'Eliminar'],
    [/\bBuscar\b/g, 'Buscar'],
    [/\bPublicar\b/g, 'Publicar'],
    [/\bPublicado\b/g, 'Publicado'],
    [/\bUsuários\b/g, 'Usuarios'],
    [/\bUsuário\b/g, 'Usuario'],
    [/\bAssinaturas\b/g, 'Suscripciones'],
    [/\bassinaturas ativas\b/g, 'suscripciones activas'],
    [/\bativos hoje\b/g, 'activos hoy'],
    [/\bda base\b/g, 'de la base'],
    [/\bno total\b/g, 'en total'],
    [/\bÚltima atividade\b/g, 'Última actividad'],
    [/\bCadastro\b/g, 'Registro'],
    [/\bObjetivo\b/g, 'Objetivo'],
    [/\bCorpo\b/g, 'Cuerpo'],
    [/\bAssinatura\b/g, 'Suscripción'],
    [/\bNão informado\b/g, 'No informado'],
    [/\bNão detectada\b/g, 'No detectada'],
    [/\bDados incompletos\b/g, 'Datos incompletos'],
    [/\bCadastrado em\b/g, 'Registrado el'],
    [/\bàs\b/g, 'a las'],
    [/\bdias\/semana\b/g, 'días/semana'],
    [/\bdias\b/g, 'días'],
    [/\bdia\b/g, 'día'],
    [/\bMenos de\b/g, 'Menos de'],
    [/\bMais de\b/g, 'Más de'],
    [/\bmeses\b/g, 'meses'],
    [/\banos\b/g, 'años'],
    [/\bNenhuma\b/g, 'Ninguna'],
    [/\bCostas\b/g, 'Espalda'],
    [/\bPernas\b/g, 'Piernas'],
    [/\bOmbros\b/g, 'Hombros'],
    [/\bBraços\b/g, 'Brazos'],
    [/\bAbdômen\b/g, 'Abdomen'],
    [/\bAlongamento\b/g, 'Estiramiento'],
    [/\bAquecimento\b/g, 'Calentamiento'],
    [/\bVer\b/g, 'Ver'],
    [/\bAbrir\b/g, 'Abrir'],
    [/\bFazer upgrade\b/g, 'Mejorar plan'],
    [/\bPlano Atual\b/g, 'Plan Actual'],
    [/\bComeçar Grátis\b/g, 'Comenzar Gratis'],
  ],
};

const ATTRIBUTES = ['placeholder', 'aria-label', 'title', 'alt'];
const textOriginals = new WeakMap<Text, string>();
const attrOriginals = new WeakMap<Element, Record<string, string>>();

function translateValue(value: string, language: UiLanguage) {
  if (language === 'pt-BR') return value;
  const trimmed = value.trim();
  const dictionary = EXACT[language];
  if (dictionary[trimmed]) {
    return value.replace(trimmed, dictionary[trimmed]);
  }
  let translated = value;
  for (const [pattern, replacement] of TERMS[language]) {
    translated = translated.replace(pattern, replacement);
  }
  return translated;
}

function shouldSkipTextNode(node: Text) {
  const text = node.nodeValue || '';
  if (!text.trim()) return true;
  const parent = node.parentElement;
  if (!parent) return true;
  return !!parent.closest('script,style,noscript,input,textarea,select,[contenteditable="true"],[data-no-auto-translate]');
}

function translateTextNode(node: Text, language: UiLanguage) {
  if (shouldSkipTextNode(node)) return;
  if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue || '');
  const original = textOriginals.get(node) || '';
  const next = translateValue(original, language);
  if (node.nodeValue !== next) node.nodeValue = next;
}

function translateAttributes(element: Element, language: UiLanguage) {
  if (element.closest('script,style,noscript,[data-no-auto-translate]')) return;
  let originals = attrOriginals.get(element);
  if (!originals) {
    originals = {};
    attrOriginals.set(element, originals);
  }
  for (const attr of ATTRIBUTES) {
    const current = element.getAttribute(attr);
    if (!current) continue;
    if (!originals[attr]) originals[attr] = current;
    const next = translateValue(originals[attr], language);
    if (current !== next) element.setAttribute(attr, next);
  }
}

function translateTree(root: ParentNode, language: UiLanguage) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    translateTextNode(node as Text, language);
    node = walker.nextNode();
  }
  if (root instanceof Element) translateAttributes(root, language);
  root.querySelectorAll?.('*').forEach(element => translateAttributes(element, language));
}

export function installUiAutoTranslate(language: UiLanguage) {
  if (typeof document === 'undefined') return () => {};
  let translating = false;
  const run = (root: ParentNode = document.body) => {
    if (translating) return;
    translating = true;
    window.requestAnimationFrame(() => {
      translateTree(root, language);
      translating = false;
    });
  };

  run();
  const observer = new MutationObserver(mutations => {
    if (translating) return;
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        translateTextNode(mutation.target as Text, language);
      }
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) translateTextNode(node as Text, language);
        if (node.nodeType === Node.ELEMENT_NODE) run(node as Element);
      });
      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        translateAttributes(mutation.target, language);
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRIBUTES,
  });
  return () => observer.disconnect();
}

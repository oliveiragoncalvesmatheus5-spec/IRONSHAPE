import { Workout } from '../types';

export const BEGINNER_WORKOUTS: Workout[] = [
  {
    id: "peito-iniciante-1",
    name: "Peito Básico",
    muscleGroup: "Peito",
    level: "Iniciante",
    duration: "35 min",
    carga: "Baixa",
    description: "Foco em técnica e consciência corporal para iniciantes.",
    planRequired: "Iniciante",
    authorUid: "system",
    exercises: [
      {
        id: "ex-1",
        name: "Supino Reto com Halteres",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Peito",
        description: "Mantenha os cotovelos a 45 graus e desça controladamente.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-chest-press-with-dumbbells-in-a-gym-23422-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838389/pexels-photo-3838389.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se no banco plano com os pés firmes no chão.",
          "Segure os halteres acima do peito com os braços estendidos.",
          "Desça os halteres lentamente até que os cotovelos estejam ligeiramente abaixo do nível do banco.",
          "Empurre os halteres de volta à posição inicial sem travar os cotovelos no topo."
        ],
        proTips: [
          "Mantenha os cotovelos a 45 graus em relação ao tronco para proteger os ombros.",
          "Imagine que está tentando 'amassar' o banco com as escápulas."
        ],
        commonErrors: [
          "Bater os halteres no topo.",
          "Retirar os pés do chão durante a execução.",
          "Arquear excessivamente a lombar."
        ]
      },
      {
        id: "ex-2",
        name: "Crucifixo Reto",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Peito",
        description: "Abra os braços mantendo uma leve flexão nos cotovelos.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-performing-dumbbell-chest-flys-on-a-bench-23424-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3839179/pexels-photo-3839179.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se no banco plano segurando os halteres com as palmas voltadas uma para a outra.",
          "Abra os braços para os lados em um arco amplo até sentir um alongamento no peito.",
          "Mantenha uma leve flexão nos cotovelos para evitar tensão excessiva nas articulações.",
          "Retorne os halteres à posição inicial usando a força do peito."
        ],
        proTips: [
          "Foque no alongamento das fibras do peito na descida.",
          "Não desça os halteres além da linha dos ombros se sentir desconforto."
        ],
        commonErrors: [
          "Transformar o movimento em um supino (flexionar demais os cotovelos).",
          "Descer rápido demais sem controle."
        ]
      },
      {
        id: "ex-3",
        name: "Flexão de Braços (Joelhos no chão)",
        series: 3,
        reps: "Máximo",
        restTime: "60s",
        muscleGroup: "Peito",
        description: "Mantenha o core ativado e o corpo alinhado.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-push-ups-on-her-knees-23418-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione as mãos no chão um pouco além da largura dos ombros.",
          "Apoie os joelhos no chão e mantenha o corpo em linha reta da cabeça aos joelhos.",
          "Desça o peito em direção ao chão flexionando os braços.",
          "Empurre de volta à posição inicial mantendo o abdômen contraído."
        ],
        proTips: [
          "Mantenha o pescoço neutro, olhando para um ponto à frente das mãos.",
          "Expire ao subir e inspire ao descer."
        ],
        commonErrors: [
          "Deixar o quadril 'cair' ou ficar muito alto.",
          "Abrir demais os cotovelos (formato de T)."
        ]
      }
    ]
  },
  {
    id: "peito-iniciante-2",
    name: "Peito & Tríceps",
    muscleGroup: "Peito",
    level: "Iniciante",
    duration: "35 min",
    carga: "Baixa",
    description: "Combinação de peito e tríceps para máxima ativação do empurrão.",
    planRequired: "Iniciante",
    authorUid: "system",
    exercises: [
      {
        id: "ex-ini-p2-1",
        name: "Flexão de Braços Completa",
        series: 3,
        reps: "Máximo",
        restTime: "60s",
        muscleGroup: "Peito",
        description: "Flexão tradicional com corpo reto da cabeça aos pés.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-push-ups-in-the-gym-23419-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162491/pexels-photo-4162491.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione as mãos no chão na largura dos ombros, braços estendidos.",
          "Mantenha o corpo em linha reta da cabeça aos calcanhares, core contraído.",
          "Desça o peito até quase tocar o chão, cotovelos a 45 graus.",
          "Empurre de volta à posição inicial de forma explosiva."
        ],
        proTips: [
          "Contraia o abdômen durante todo o exercício para estabilizar a coluna.",
          "Se necessário, apoie os joelhos no chão para manter a boa forma."
        ],
        commonErrors: [
          "Deixar o quadril subir ou afundar.",
          "Abrir os cotovelos em 90 graus — prejudica os ombros."
        ]
      },
      {
        id: "ex-ini-p2-2",
        name: "Supino Reto com Barra",
        series: 3,
        reps: "10",
        restTime: "60s",
        muscleGroup: "Peito",
        description: "Exercício base para ganho de força e volume no peitoral.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-a-bench-press-in-the-gym-23421-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838389/pexels-photo-3838389.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se no banco plano, pés firmes no chão, pegada na barra ligeiramente além dos ombros.",
          "Desça a barra de forma controlada até tocar levemente o peito.",
          "Empurre a barra para cima até os braços ficarem quase estendidos.",
          "Mantenha as escápulas retraídas e o arco lombar natural."
        ],
        proTips: [
          "Inspire ao descer e expire ao empurrar.",
          "Mantenha os punhos alinhados com os cotovelos durante o movimento."
        ],
        commonErrors: [
          "Soltar a barra de forma descontrolada no peito.",
          "Retirar os pés do chão para forçar mais carga."
        ]
      },
      {
        id: "ex-ini-p2-3",
        name: "Tríceps no Banco",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Braços",
        description: "Extensão de tríceps usando o peso do corpo em um banco.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-tricep-dips-23427-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162580/pexels-photo-4162580.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se na borda de um banco e apoie as mãos ao lado dos quadris.",
          "Deslize o corpo para fora do banco e desça flexionando os cotovelos.",
          "Desça até os cotovelos formarem cerca de 90 graus.",
          "Empurre de volta à posição inicial estendendo os tríceps."
        ],
        proTips: [
          "Mantenha o corpo próximo ao banco durante o movimento.",
          "Não desça além de 90 graus para proteger os ombros."
        ],
        commonErrors: [
          "Afastar demais o corpo do banco.",
          "Usar os ombros em vez de focar nos tríceps."
        ]
      }
    ]
  },
  {
    id: "costas-iniciante-1",
    name: "Largura das Costas",
    muscleGroup: "Costas",
    level: "Iniciante",
    duration: "35 min",
    carga: "Baixa",
    description: "Exercícios de puxada para desenvolver o latíssimo e criar largura nas costas.",
    planRequired: "Iniciante",
    authorUid: "system",
    exercises: [
      {
        id: "ex-4",
        name: "Puxada Alta (Lat Pulldown)",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Costas",
        description: "Puxe a barra em direção ao peito, focando nas escápulas.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lat-pulldown-exercise-in-a-gym-23427-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164761/pexels-photo-4164761.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se na máquina e ajuste o apoio para as coxas ficarem presas.",
          "Segure a barra com pegada pronada (palmas para frente) um pouco mais larga que os ombros.",
          "Puxe a barra em direção ao peito, contraindo as escápulas.",
          "Retorne à posição inicial de forma controlada, estendendo completamente os braços."
        ],
        proTips: [
          "Imagine que está tentando colocar as escápulas no bolso de trás da calça.",
          "Incline levemente o tronco para trás para melhorar a amplitude do movimento."
        ],
        commonErrors: [
          "Usar o balanço do corpo para ajudar na execução.",
          "Não estender completamente os braços na fase excêntrica.",
          "Puxar a barra atrás da cabeça, sobrecarregando o pescoço."
        ]
      },
      {
        id: "ex-ini-c1-2",
        name: "Puxada Supinada (Pegada Invertida)",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Costas",
        description: "A pegada supinada aumenta o envolvimento do bíceps e o alongamento do latíssimo.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lat-pulldown-exercise-in-a-gym-23427-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164761/pexels-photo-4164761.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Segure a barra com pegada supinada (palmas para você) na largura dos ombros.",
          "Incline levemente o tronco para trás e deprime as escápulas.",
          "Puxe a barra até a linha do queixo contraindo o latíssimo.",
          "Retorne lentamente estendendo completamente os braços."
        ],
        proTips: [
          "A pegada supinada é mais fácil que a pronada — ótima para iniciantes.",
          "Foque em puxar com as escápulas, não com os braços."
        ],
        commonErrors: [
          "Encolher os ombros em vez de deprimi-los antes de puxar.",
          "Usar carga excessiva que compromete a técnica."
        ]
      },
      {
        id: "ex-ini-c1-3",
        name: "Pullover com Halter",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Costas",
        description: "Excelente isolamento do latíssimo e expansão da caixa torácica.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lat-pulldown-exercise-in-a-gym-23427-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164761/pexels-photo-4164761.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se transversalmente em um banco com os ombros apoiados e o quadril suspenso.",
          "Segure um halter com as duas mãos acima do peito, braços levemente flexionados.",
          "Abaixe o halter atrás da cabeça em arco sentindo o alongamento do latíssimo.",
          "Traga de volta à posição inicial usando a força das costas."
        ],
        proTips: [
          "Expire ao trazer o halter para frente para maximizar a contração do latíssimo.",
          "Não desça demais — pare quando sentir tensão adequada, sem dor."
        ],
        commonErrors: [
          "Usar os tríceps para empurrar o halter em vez do latíssimo para puxar.",
          "Dobrar demais os cotovelos, perdendo o foco nas costas."
        ]
      }
    ]
  },
  {
    id: "costas-iniciante-2",
    name: "Espessura das Costas",
    muscleGroup: "Costas",
    level: "Iniciante",
    duration: "35 min",
    carga: "Baixa",
    description: "Remadas para desenvolver espessura e postura — romboides e trapézio médio.",
    planRequired: "Iniciante",
    authorUid: "system",
    exercises: [
      {
        id: "ex-5",
        name: "Remada Baixa com Triângulo",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Costas",
        description: "Mantenha a coluna ereta e puxe em direção ao umbigo.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se no banco com os joelhos levemente flexionados e os pés no apoio.",
          "Segure o triângulo com ambas as mãos e mantenha a coluna neutra.",
          "Puxe o triângulo em direção ao umbigo, abrindo o peito e contraindo as escápulas.",
          "Retorne à posição inicial de forma controlada sem arredondar a lombar."
        ],
        proTips: [
          "Mantenha o peito alto durante todo o movimento para ativar melhor as costas.",
          "Inspire ao estender os braços e expire ao puxar."
        ],
        commonErrors: [
          "Arredondar a lombar ao puxar a carga.",
          "Usar os bíceps em vez de focar nas costas.",
          "Oscilar o tronco para frente e para trás."
        ]
      },
      {
        id: "ex-ini-c2-2",
        name: "Remada Unilateral com Halter (Apoiado)",
        series: 3,
        reps: "12 cada lado",
        restTime: "60s",
        muscleGroup: "Costas",
        description: "Foco total em um lado de cada vez para corrigir desequilíbrios.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie um joelho e a mão no banco com o tronco paralelo ao chão.",
          "Segure o halter com o braço estendido diretamente abaixo do ombro.",
          "Puxe o halter em direção ao quadril mantendo o cotovelo junto ao corpo.",
          "Desça controladamente até a extensão completa do braço."
        ],
        proTips: [
          "Lidere o movimento com o cotovelo, não com a mão.",
          "Contraia a escápula no pico e segure por 1 segundo."
        ],
        commonErrors: [
          "Rodar excessivamente o tronco usando impulso.",
          "Puxar em direção ao ombro em vez do quadril."
        ]
      },
      {
        id: "ex-ini-c2-3",
        name: "Remada com Elástico (Postura)",
        series: 3,
        reps: "15",
        restTime: "45s",
        muscleGroup: "Costas",
        description: "Ideal para iniciantes — fortalece os romboides e melhora a postura.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Prenda o elástico em uma superfície firme na altura do peito.",
          "Segure as pontas com as palmas voltadas entre si e os braços estendidos.",
          "Puxe o elástico em direção ao abdômen retraindo as escápulas ao máximo.",
          "Retorne lentamente à posição inicial."
        ],
        proTips: [
          "Foque em aproximar as escápulas — é isso que melhora a postura.",
          "Sem elástico? Substitua pela remada na polia com barra reta."
        ],
        commonErrors: [
          "Deixar os ombros subirem durante a puxada.",
          "Não completar a retração escapular, perdendo o benefício postural."
        ]
      }
    ]
  },
  {
    id: "pernas-iniciante-1",
    name: "Quadríceps",
    muscleGroup: "Pernas",
    level: "Iniciante",
    duration: "35 min",
    carga: "Baixa",
    description: "Exercícios focados na frente da coxa — agachamento, leg press e extensora.",
    planRequired: "Iniciante",
    authorUid: "system",
    exercises: [
      {
        id: "ex-6",
        name: "Agachamento Livre",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Pernas",
        description: "Mantenha a postura reta e desça como se fosse sentar em uma cadeira.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-23425-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162438/pexels-photo-4162438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé com os pés na largura dos ombros e os dedos levemente apontados para fora.",
          "Mantenha o peito erguido, a coluna neutra e o core contraído.",
          "Desça flexionando os joelhos e quadril como se fosse sentar em uma cadeira.",
          "Suba de volta à posição inicial empurrando o chão com os calcanhares."
        ],
        proTips: [
          "Mantenha os joelhos alinhados com os dedos dos pés durante todo o movimento.",
          "Desça até que as coxas fiquem paralelas ao chão para máxima ativação."
        ],
        commonErrors: [
          "Deixar os joelhos colapsarem para dentro.",
          "Levantar os calcanhares do chão.",
          "Arredondar a lombar na fase mais baixa do movimento."
        ]
      },
      {
        id: "ex-7",
        name: "Leg Press 45",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Pernas",
        description: "Não estenda totalmente os joelhos no topo do movimento.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-leg-press-in-gym-23429-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837781/pexels-photo-3837781.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se na máquina com as costas completamente apoiadas no encosto.",
          "Posicione os pés na plataforma na largura dos ombros.",
          "Empurre a plataforma sem travar completamente os joelhos no topo.",
          "Desça de forma controlada até que as coxas fiquem próximas ao abdômen."
        ],
        proTips: [
          "Posicionar os pés mais baixos na plataforma aumenta o foco no quadríceps.",
          "Não deixe os joelhos ultrapassarem a ponta dos pés ao descer."
        ],
        commonErrors: [
          "Travar os joelhos no topo, sobrecarregando a articulação.",
          "Retirar o quadril do assento na descida.",
          "Posicionar os pés muito altos, transferindo o trabalho para os glúteos."
        ]
      },
      {
        id: "ex-8",
        name: "Cadeira Extensora",
        series: 3,
        reps: "15",
        restTime: "45s",
        muscleGroup: "Pernas",
        description: "Isolamento puro do quadríceps — controle o movimento nos dois sentidos.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-leg-extensions-23430-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837757/pexels-photo-3837757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajuste o banco para que o joelho fique alinhado com o eixo da máquina.",
          "Posicione o apoio acolchoado sobre os tornozelos.",
          "Estenda as pernas de forma controlada até quase a extensão total.",
          "Desça lentamente resistindo à carga para maximizar a ativação do quadríceps."
        ],
        proTips: [
          "Contraia o quadríceps no pico do movimento e segure por 1 segundo.",
          "Use cargas moderadas para proteger a articulação do joelho."
        ],
        commonErrors: [
          "Usar impulso para levantar a carga em vez de força muscular.",
          "Descer rápido demais sem controlar o movimento excêntrico.",
          "Usar carga excessiva que compromete a execução."
        ]
      }
    ]
  },
  {
    id: "pernas-iniciante-2",
    name: "Posterior e Glúteos",
    muscleGroup: "Pernas",
    level: "Iniciante",
    duration: "35 min",
    carga: "Baixa",
    description: "Isquiotibiais e glúteos — a parte mais esquecida e mais importante das pernas.",
    planRequired: "Iniciante",
    authorUid: "system",
    exercises: [
      {
        id: "ex-ini-p2-1",
        name: "Stiff com Halteres",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Pernas",
        description: "Sinta o alongamento dos isquiotibiais a cada descida.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-deadlift-exercise-23441-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162587/pexels-photo-4162587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé com os halteres na frente das coxas e joelhos levemente flexionados.",
          "Empurre o quadril para trás mantendo a coluna neutra.",
          "Desça os halteres próximos às pernas até sentir tensão nos isquiotibiais.",
          "Contraia os glúteos para retornar à posição inicial."
        ],
        proTips: [
          "Foque no empurrão do quadril para trás — não em dobrar o tronco.",
          "Quanto maior o alongamento dos isquiotibiais, melhor o estímulo."
        ],
        commonErrors: [
          "Arredondar a lombar durante a descida.",
          "Dobrar demais os joelhos, transformando em levantamento terra."
        ]
      },
      {
        id: "ex-ini-p2-2",
        name: "Cadeira Flexora",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Pernas",
        description: "Isolamento dos isquiotibiais — controle a descida.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-leg-extensions-23430-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837757/pexels-photo-3837757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se na máquina com os joelhos alinhados ao eixo e o apoio nos tornozelos.",
          "Flexione os joelhos trazendo o apoio em direção aos glúteos.",
          "Contraia os isquiotibiais no pico e segure por 1 segundo.",
          "Desça lentamente à posição inicial resistindo à carga."
        ],
        proTips: [
          "Pressione o quadril contra o banco para isolar melhor os isquiotibiais.",
          "A fase excêntrica (descida) é tão importante quanto a subida."
        ],
        commonErrors: [
          "Levantar o quadril do banco para completar as reps.",
          "Descer rápido demais sem controlar o movimento."
        ]
      },
      {
        id: "ex-ini-p2-3",
        name: "Elevação Pélvica (Hip Thrust) com Peso Corporal",
        series: 3,
        reps: "15",
        restTime: "45s",
        muscleGroup: "Pernas",
        description: "O melhor exercício para glúteos — mesmo sem peso já é muito eficaz.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-23425-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162438/pexels-photo-4162438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie as escápulas em um banco com os joelhos flexionados e pés no chão.",
          "Mantenha o core contraído e desça o quadril em direção ao chão.",
          "Empurre o quadril para cima contraindo os glúteos no topo.",
          "Segure a contração por 2 segundos antes de descer."
        ],
        proTips: [
          "No topo, o joelho deve estar a 90 graus e o tronco paralelo ao chão.",
          "Aperte os glúteos ao máximo no pico — não apenas eleve o quadril."
        ],
        commonErrors: [
          "Arquear a lombar no topo em vez de contrair os glúteos.",
          "Posicionar os pés muito longe ou perto do banco."
        ]
      }
    ]
  },
  {
    id: "ombros-iniciante-1",
    name: "Deltoide Anterior e Medial",
    muscleGroup: "Ombros",
    level: "Iniciante",
    duration: "30 min",
    carga: "Baixa",
    description: "Desenvolvimento e elevações para as cabeças anterior e medial do deltoide.",
    planRequired: "Iniciante",
    authorUid: "system",
    exercises: [
      {
        id: "ex-9",
        name: "Desenvolvimento com Halteres",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Ombros",
        description: "Empurre os halteres para cima sem bater um no outro.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-dumbbell-shoulder-press-23431-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837793/pexels-photo-3837793.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se em um banco com encosto, segurando os halteres na altura dos ombros.",
          "Mantenha os cotovelos a 90 graus com as palmas voltadas para frente.",
          "Empurre os halteres para cima até quase a extensão total sem bater um no outro.",
          "Desça lentamente de volta à posição inicial mantendo o controle."
        ],
        proTips: [
          "Mantenha o core ativado para evitar arquear a lombar durante o movimento.",
          "Não trave os cotovelos no topo para manter a tensão nos ombros."
        ],
        commonErrors: [
          "Arquear a lombar ao empurrar os halteres para cima.",
          "Deixar os cotovelos fecharem demais na descida.",
          "Usar impulso do corpo para levantar a carga."
        ]
      },
      {
        id: "ex-10",
        name: "Elevação Lateral",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Ombros",
        description: "Suba os braços até a altura dos ombros.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lateral-raises-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837799/pexels-photo-3837799.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé com os halteres nas laterais do corpo e uma leve flexão nos cotovelos.",
          "Eleve os braços para os lados em um arco até a altura dos ombros.",
          "Mantenha os cotovelos ligeiramente acima dos punhos durante todo o movimento.",
          "Desça de forma controlada até a posição inicial."
        ],
        proTips: [
          "Gire levemente os halteres como se estivesse 'derramando uma jarra' para ativar melhor o deltoide médio.",
          "Use cargas leves e foque na qualidade do movimento."
        ],
        commonErrors: [
          "Usar impulso do corpo (balançar) para levantar os halteres.",
          "Subir os braços acima da linha dos ombros, sobrecarregando o trapézio.",
          "Dobrar excessivamente os cotovelos, transformando em rosca."
        ]
      },
      {
        id: "ex-ini-o1-3",
        name: "Elevação Frontal com Halteres",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Ombros",
        description: "Ativa o deltoide anterior — a cabeça frontal do ombro.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-dumbbell-shoulder-press-23431-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837793/pexels-photo-3837793.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé com os halteres na frente das coxas, palmas voltadas para baixo.",
          "Eleve um halter de cada vez até a altura dos ombros com o braço levemente flexionado.",
          "Segure no topo por 1 segundo e desça lentamente.",
          "Alterne os braços para maior concentração em cada lado."
        ],
        proTips: [
          "Não suba além dos ombros — o trapézio assume o movimento.",
          "Execute de forma alternada para melhor controle e equilíbrio."
        ],
        commonErrors: [
          "Usar o balanço do tronco para elevar o halter.",
          "Rotar o pulso para cima durante o movimento."
        ]
      }
    ]
  },
  {
    id: "ombros-iniciante-2",
    name: "Deltoide Posterior",
    muscleGroup: "Ombros",
    level: "Iniciante",
    duration: "25 min",
    carga: "Baixa",
    description: "A cabeça mais esquecida do ombro — essencial para postura e saúde articular.",
    planRequired: "Iniciante",
    authorUid: "system",
    exercises: [
      {
        id: "ex-ini-o2-1",
        name: "Elevação Posterior com Halteres (Voador Invertido)",
        series: 3,
        reps: "15",
        restTime: "45s",
        muscleGroup: "Ombros",
        description: "Inclina o tronco à frente e abre os braços para ativar o deltoide posterior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lateral-raises-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837799/pexels-photo-3837799.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Incline o tronco a 45-90 graus com os halteres pendurados abaixo do peito.",
          "Mantenha uma leve flexão nos cotovelos e o pescoço neutro.",
          "Eleve os braços para os lados até a altura dos ombros.",
          "Desça lentamente sem balançar o tronco."
        ],
        proTips: [
          "Quanto mais inclinado o tronco, maior o foco no deltoide posterior.",
          "Use cargas muito leves — o deltoide posterior é pequeno e fraco."
        ],
        commonErrors: [
          "Balançar o tronco para ajudar a levantar os halteres.",
          "Usar carga excessiva que faz o trapézio dominar o movimento."
        ]
      },
      {
        id: "ex-ini-o2-2",
        name: "Face Pull com Elástico",
        series: 3,
        reps: "15",
        restTime: "45s",
        muscleGroup: "Ombros",
        description: "Fortalece o deltoide posterior e os rotadores externos — fundamental para a saúde do ombro.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-tricep-pushdowns-23434-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164767/pexels-photo-4164767.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Prenda o elástico na altura dos olhos e segure com as duas mãos.",
          "Puxe o elástico em direção ao rosto separando as mãos ao final.",
          "Mantenha os cotovelos altos durante todo o movimento.",
          "Retorne lentamente à posição inicial."
        ],
        proTips: [
          "Inclua esse exercício em todo treino de ombros para prevenir lesões.",
          "Mantenha os cotovelos acima dos ombros durante a puxada."
        ],
        commonErrors: [
          "Deixar os cotovelos caírem, mudando o ângulo do exercício.",
          "Puxar com os braços em vez de com os ombros posteriores."
        ]
      },
      {
        id: "ex-ini-o2-3",
        name: "Crucifixo Inverso na Máquina (Peck Deck Invertido)",
        series: 3,
        reps: "15",
        restTime: "45s",
        muscleGroup: "Ombros",
        description: "Isolamento seguro e eficaz para o deltoide posterior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lateral-raises-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837799/pexels-photo-3837799.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se de frente para o encosto da máquina peck deck com os braços à frente.",
          "Segure os apoios com as palmas voltadas entre si.",
          "Abra os braços para os lados até sentir contração no deltoide posterior.",
          "Retorne lentamente à posição inicial."
        ],
        proTips: [
          "A máquina estabiliza o movimento — ótima para iniciantes aprenderem o padrão.",
          "Use amplitude total para maximizar o recrutamento do deltoide posterior."
        ],
        commonErrors: [
          "Usar carga excessiva fazendo o trapézio assumir o movimento.",
          "Não completar o arco de abertura, reduzindo a ativação."
        ]
      }
    ]
  },
  {
    id: "bracos-iniciante-1",
    name: "Bíceps",
    muscleGroup: "Braços",
    level: "Iniciante",
    duration: "25 min",
    carga: "Baixa",
    description: "Exercícios de flexão para desenvolver volume e força nos bíceps.",
    planRequired: "Iniciante",
    authorUid: "system",
    exercises: [
      {
        id: "ex-11",
        name: "Rosca Direta com Halteres",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Braços",
        description: "Mantenha os cotovelos fixos ao lado do corpo.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-dumbbell-bicep-curls-23433-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164766/pexels-photo-4164766.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé com os halteres nas mãos e os braços estendidos ao lado do corpo.",
          "Mantenha os cotovelos fixos ao lado do tronco durante todo o movimento.",
          "Flexione os braços trazendo os halteres em direção aos ombros.",
          "Desça lentamente à posição inicial sem balançar o corpo."
        ],
        proTips: [
          "Supine os pulsos no topo do movimento para contrair mais o bíceps.",
          "Realize o movimento de forma alternada para maior concentração em cada braço."
        ],
        commonErrors: [
          "Balançar o tronco para ajudar a levantar a carga.",
          "Mover os cotovelos para frente, tirando a tensão do bíceps.",
          "Descer os halteres rápido demais sem controle."
        ]
      },
      {
        id: "ex-ini-b1-2",
        name: "Rosca Martelo",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Braços",
        description: "Ativa o braquial e o braquiorradial além do bíceps — mais espessura no braço.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-dumbbell-bicep-curls-23433-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164766/pexels-photo-4164766.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé com os halteres nas laterais, palmas voltadas para dentro (pegada neutra).",
          "Mantenha os cotovelos fixos e flexione os braços como se fosse martelar algo.",
          "Suba até o halter atingir a altura do ombro.",
          "Desça lentamente à posição inicial."
        ],
        proTips: [
          "A pegada neutra ativa músculos adicionais que a rosca direta não alcança.",
          "Execute alternado para melhor foco em cada braço."
        ],
        commonErrors: [
          "Balançar os cotovelos para frente durante a subida.",
          "Usar impulso do tronco para levantar os halteres."
        ]
      },
      {
        id: "ex-ini-b1-3",
        name: "Rosca Scott com Halter",
        series: 3,
        reps: "10",
        restTime: "60s",
        muscleGroup: "Braços",
        description: "Banco Scott elimina qualquer trapaça — isolamento total do bíceps.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-dumbbell-bicep-curls-23433-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164766/pexels-photo-4164766.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie o tríceps no banco Scott com o braço totalmente estendido.",
          "Segure o halter com pegada supinada (palma para cima).",
          "Flexione o cotovelo trazendo o halter até o ombro.",
          "Desça lentamente até a extensão completa do cotovelo."
        ],
        proTips: [
          "Não trave o cotovelo na extensão total — mantenha tensão constante.",
          "O banco elimina o balanço — aproveite para focar 100% no bíceps."
        ],
        commonErrors: [
          "Não estender completamente o braço na fase excêntrica.",
          "Subir o ombro do apoio para ajudar no movimento."
        ]
      }
    ]
  },
  {
    id: "bracos-iniciante-2",
    name: "Tríceps",
    muscleGroup: "Braços",
    level: "Iniciante",
    duration: "25 min",
    carga: "Baixa",
    description: "Exercícios de extensão para as três cabeças do tríceps — foco em técnica.",
    planRequired: "Iniciante",
    authorUid: "system",
    exercises: [
      {
        id: "ex-12",
        name: "Tríceps Pulley",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Braços",
        description: "Estenda totalmente os braços para baixo.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-tricep-pushdowns-23434-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164767/pexels-photo-4164767.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione-se em frente ao cabo alto com pegada pronada na barra reta.",
          "Mantenha os cotovelos fixos ao lado do tronco com os braços a 90 graus.",
          "Empurre a barra para baixo estendendo completamente os braços.",
          "Retorne à posição inicial de forma controlada sem mover os cotovelos."
        ],
        proTips: [
          "Contraia o tríceps no ponto de extensão máxima e segure por 1 segundo.",
          "Mantenha o tronco levemente inclinado para frente para melhor estabilidade."
        ],
        commonErrors: [
          "Mover os cotovelos para frente e para trás durante a execução.",
          "Usar o peso do corpo para empurrar a barra.",
          "Não estender completamente os braços, encurtando a amplitude."
        ]
      },
      {
        id: "ex-ini-t1-2",
        name: "Tríceps Testa com Halteres",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Braços",
        description: "Ativa a cabeça longa do tríceps com braços elevados.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-tricep-pushdowns-23434-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164767/pexels-photo-4164767.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se no banco plano com os halteres seguros acima da cabeça, braços estendidos.",
          "Mantenha os cotovelos apontando para o teto e fixos durante todo o movimento.",
          "Flexione os cotovelos descendo os halteres em direção às orelhas.",
          "Estenda os cotovelos de volta à posição inicial."
        ],
        proTips: [
          "Cotovelos apontados para o teto = máxima ativação da cabeça longa do tríceps.",
          "Execute devagar para evitar pressão excessiva nos cotovelos."
        ],
        commonErrors: [
          "Abrir os cotovelos para os lados durante a execução.",
          "Usar carga excessiva que causa desconforto nos cotovelos."
        ]
      },
      {
        id: "ex-ini-t1-3",
        name: "Mergulho entre Bancos (Tríceps)",
        series: 3,
        reps: "Máximo",
        restTime: "60s",
        muscleGroup: "Braços",
        description: "Peso corporal para o tríceps — mantenha o tronco reto para foco no tríceps.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-push-ups-23444-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie as mãos em um banco atrás do corpo com os pés no chão à frente.",
          "Mantenha o tronco ereto e próximo ao banco.",
          "Desça flexionando os cotovelos até os braços formarem 90 graus.",
          "Empurre de volta à posição inicial estendendo os cotovelos."
        ],
        proTips: [
          "Tronco reto = mais tríceps. Tronco inclinado = mais peito.",
          "Para aumentar a dificuldade, eleve os pés em outro banco."
        ],
        commonErrors: [
          "Deixar o tronco afastar do banco, sobrecarregando os ombros.",
          "Não descer o suficiente, reduzindo a amplitude do movimento."
        ]
      }
    ]
  },
  {
    id: "abdomen-iniciante-1",
    name: "Abdominal Superior",
    muscleGroup: "Abdômen",
    level: "Iniciante",
    duration: "20 min",
    carga: "Baixa",
    description: "Exercícios para as fibras superiores do reto abdominal com foco em técnica.",
    planRequired: "Iniciante",
    authorUid: "system",
    exercises: [
      {
        id: "ex-13",
        name: "Abdominal Supra",
        series: 3,
        reps: "20",
        restTime: "30s",
        muscleGroup: "Abdômen",
        description: "Tire apenas as escápulas do chão.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crunches-23435-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se no chão com os joelhos flexionados e os pés apoiados no chão.",
          "Posicione as mãos atrás da cabeça sem entrelaçar os dedos.",
          "Contraia o abdômen elevando as escápulas do chão em direção aos joelhos.",
          "Desça lentamente de volta ao chão sem relaxar completamente o abdômen."
        ],
        proTips: [
          "Foque em 'enrolar' o tronco em vez de simplesmente subir o pescoço.",
          "Expire ao subir e inspire ao descer para melhor contração abdominal."
        ],
        commonErrors: [
          "Puxar o pescoço com as mãos, sobrecarregando a cervical.",
          "Subir demais o tronco, transformando em um abdominal completo.",
          "Relaxar o abdômen ao descer em vez de manter tensão."
        ]
      },
      {
        id: "ex-14",
        name: "Prancha Isométrica",
        series: 3,
        reps: "30s",
        restTime: "45s",
        muscleGroup: "Abdômen",
        description: "Mantenha o corpo reto e o abdômen contraído.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-plank-exercise-23436-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757954/pexels-photo-3757954.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie os antebraços e as pontas dos pés no chão com o corpo paralelo ao solo.",
          "Mantenha o corpo em linha reta da cabeça aos calcanhares.",
          "Contraia o abdômen, glúteos e quadríceps durante todo o tempo.",
          "Respire normalmente mantendo a posição pelo tempo determinado."
        ],
        proTips: [
          "Imagine que está tentando aproximar os cotovelos dos pés para ativar ainda mais o core.",
          "Olhe para o chão ligeiramente à frente das mãos para manter o pescoço neutro."
        ],
        commonErrors: [
          "Deixar o quadril subir ou cair, quebrando o alinhamento do corpo.",
          "Prender a respiração durante a execução.",
          "Apoiar nas mãos em vez dos antebraços, reduzindo a dificuldade."
        ]
      },
      {
        id: "ex-ini-ab1-3",
        name: "Abdominal com Rotação",
        series: 3,
        reps: "16",
        restTime: "30s",
        muscleGroup: "Abdômen",
        description: "Envolve o oblíquo durante o crunch — mais ativação com o mesmo movimento.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crunches-23435-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se com joelhos flexionados e mãos atrás da cabeça.",
          "Eleve as escápulas do chão contraindo o abdômen.",
          "No topo, gire o tronco levando o cotovelo direito em direção ao joelho esquerdo.",
          "Alterne os lados a cada repetição."
        ],
        proTips: [
          "A rotação deve vir do tronco, não do pescoço.",
          "Mantenha os pés apoiados durante todo o movimento."
        ],
        commonErrors: [
          "Rodar apenas o pescoço em vez do tronco.",
          "Descer rápido demais entre as repetições."
        ]
      }
    ]
  },
  {
    id: "abdomen-iniciante-2",
    name: "Abdominal Inferior e Oblíquos",
    muscleGroup: "Abdômen",
    level: "Iniciante",
    duration: "20 min",
    carga: "Baixa",
    description: "Elevação de pernas e exercícios laterais para a parte inferior e os lados do abdômen.",
    planRequired: "Iniciante",
    authorUid: "system",
    exercises: [
      {
        id: "ex-ini-ab2-1",
        name: "Elevação de Pernas Deitado",
        series: 3,
        reps: "15",
        restTime: "45s",
        muscleGroup: "Abdômen",
        description: "Ativa fortemente o reto abdominal inferior — mantenha a lombar no chão.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crunches-23435-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se no chão com as mãos sob o quadril para apoio.",
          "Mantenha as pernas juntas e levemente flexionadas nos joelhos.",
          "Eleve as pernas até formarem 90 graus com o tronco.",
          "Desça lentamente sem deixar os pés tocarem o chão."
        ],
        proTips: [
          "Quanto mais próximo os pés chegam ao chão sem tocar, maior o esforço.",
          "Se sentir pressão na lombar, aumente a flexão dos joelhos."
        ],
        commonErrors: [
          "Deixar a lombar descolar do chão durante a descida.",
          "Usar impulso para elevar as pernas em vez de contrair o abdômen."
        ]
      },
      {
        id: "ex-ini-ab2-2",
        name: "Prancha Lateral",
        series: 3,
        reps: "20s cada lado",
        restTime: "30s",
        muscleGroup: "Abdômen",
        description: "Isométrico para os oblíquos — excelente para estabilidade lateral.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-plank-exercise-23436-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757954/pexels-photo-3757954.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie o antebraço no chão com o cotovelo abaixo do ombro.",
          "Empilhe os pés um sobre o outro e levante o quadril do chão.",
          "Mantenha o corpo em linha reta da cabeça aos pés.",
          "Segure a posição pelo tempo determinado e troque de lado."
        ],
        proTips: [
          "Empurre o quadril para cima ativamente — não apenas sustente o peso.",
          "Para facilitar, apoie o joelho inferior no chão."
        ],
        commonErrors: [
          "Deixar o quadril cair, perdendo o alinhamento lateral.",
          "Rotar o tronco para cima ou para baixo durante o exercício."
        ]
      },
      {
        id: "ex-ini-ab2-3",
        name: "Russian Twist",
        series: 3,
        reps: "20",
        restTime: "30s",
        muscleGroup: "Abdômen",
        description: "Rotação do tronco para ativar os oblíquos interno e externo.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crunches-23435-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se no chão com os joelhos flexionados e o tronco inclinado a 45 graus.",
          "Junte as mãos à frente do peito ou segure um peso leve.",
          "Gire o tronco de um lado para o outro tocando o chão com as mãos.",
          "Mantenha o core contraído durante toda a execução."
        ],
        proTips: [
          "Eleve os pés do chão para aumentar a dificuldade.",
          "A rotação deve vir do tronco, não dos braços."
        ],
        commonErrors: [
          "Girar apenas os braços sem rotar o tronco.",
          "Inclinar demais para trás, sobrecarregando a lombar."
        ]
      }
    ]
  },
  {
    id: "fullbody-iniciante-1",
    name: "Full Body Iniciante",
    muscleGroup: "Full Body",
    level: "Iniciante",
    duration: "45 min",
    carga: "Baixa",
    description: "Treino de corpo inteiro para máxima eficiência.",
    planRequired: "Iniciante",
    authorUid: "system",
    exercises: [
      {
        id: "ex-15",
        name: "Agachamento Livre",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Pernas",
        description: "Mantenha a postura reta e desça controladamente.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-23425-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162438/pexels-photo-4162438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé com os pés na largura dos ombros e os dedos levemente apontados para fora.",
          "Mantenha o peito erguido, a coluna neutra e o core contraído.",
          "Desça flexionando os joelhos e quadril como se fosse sentar em uma cadeira.",
          "Suba de volta à posição inicial empurrando o chão com os calcanhares."
        ],
        proTips: [
          "Mantenha os joelhos alinhados com os dedos dos pés durante todo o movimento.",
          "Desça até que as coxas fiquem paralelas ao chão para máxima ativação."
        ],
        commonErrors: [
          "Deixar os joelhos colapsarem para dentro.",
          "Levantar os calcanhares do chão.",
          "Arredondar a lombar na fase mais baixa do movimento."
        ]
      },
      {
        id: "ex-16",
        name: "Supino Reto com Halteres",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Peito",
        description: "Mantenha os cotovelos a 45 graus.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-chest-press-with-dumbbells-in-a-gym-23422-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838389/pexels-photo-3838389.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se no banco plano com os pés firmes no chão.",
          "Segure os halteres acima do peito com os braços estendidos.",
          "Desça os halteres lentamente até que os cotovelos estejam ligeiramente abaixo do nível do banco.",
          "Empurre os halteres de volta à posição inicial sem travar os cotovelos no topo."
        ],
        proTips: [
          "Mantenha os cotovelos a 45 graus em relação ao tronco para proteger os ombros.",
          "Imagine que está tentando 'amassar' o banco com as escápulas."
        ],
        commonErrors: [
          "Bater os halteres no topo.",
          "Retirar os pés do chão durante a execução.",
          "Arquear excessivamente a lombar."
        ]
      },
      {
        id: "ex-17",
        name: "Remada Baixa",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Costas",
        description: "Puxe em direção ao umbigo.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se no banco com os joelhos levemente flexionados e os pés no apoio.",
          "Segure o cabo ou triângulo com ambas as mãos e mantenha a coluna neutra.",
          "Puxe em direção ao umbigo, contraindo as escápulas e abrindo o peito.",
          "Retorne à posição inicial de forma controlada sem arredondar a lombar."
        ],
        proTips: [
          "Mantenha o peito alto durante todo o movimento para ativar melhor as costas.",
          "Inspire ao estender os braços e expire ao puxar."
        ],
        commonErrors: [
          "Arredondar a lombar ao puxar a carga.",
          "Usar os bíceps em vez de focar nas costas.",
          "Oscilar o tronco para frente e para trás."
        ]
      }
    ]
  },
  {
    id: "fullbody-iniciante-2",
    name: "Full Body Funcional",
    muscleGroup: "Full Body",
    level: "Iniciante",
    duration: "40 min",
    carga: "Baixa",
    description: "Circuito funcional de corpo inteiro com foco em mobilidade e força.",
    planRequired: "Iniciante",
    authorUid: "system",
    exercises: [
      {
        id: "ex-ini-fb2-1",
        name: "Agachamento Sumô",
        series: 3,
        reps: "15",
        restTime: "60s",
        muscleGroup: "Pernas",
        description: "Agachamento com pegada ampla para ativar adutores e glúteos.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-23425-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162438/pexels-photo-4162438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé com os pés mais afastados que a largura dos ombros, dedos apontados para fora.",
          "Mantenha o tronco ereto e o core ativado.",
          "Desça flexionando os joelhos na direção dos dedos dos pés.",
          "Suba contraindo os glúteos e adutores."
        ],
        proTips: [
          "Quanto mais afastados os pés, maior o foco nos adutores e glúteos.",
          "Mantenha os joelhos apontando na mesma direção dos dedos."
        ],
        commonErrors: [
          "Deixar os joelhos colapsarem para dentro.",
          "Inclinar excessivamente o tronco para frente."
        ]
      },
      {
        id: "ex-ini-fb2-2",
        name: "Flexão Diamante",
        series: 3,
        reps: "10",
        restTime: "60s",
        muscleGroup: "Peito",
        description: "Flexão com as mãos formando um diamante, foco em tríceps e peitoral interno.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-push-ups-in-the-gym-23419-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162491/pexels-photo-4162491.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione as mãos próximas formando um triângulo com os polegares e indicadores.",
          "Mantenha o corpo reto e o core contraído.",
          "Desça o peito em direção às mãos, cotovelos apontando para trás.",
          "Empurre de volta à posição inicial."
        ],
        proTips: [
          "Se for difícil, apoie os joelhos no chão para reduzir a carga.",
          "Foque na contração dos tríceps no topo do movimento."
        ],
        commonErrors: [
          "Deixar os cotovelos abrirem para os lados.",
          "Não manter o corpo em linha reta."
        ]
      },
      {
        id: "ex-ini-fb2-3",
        name: "Prancha Isométrica",
        series: 3,
        reps: "30s",
        restTime: "45s",
        muscleGroup: "Abdômen",
        description: "Isometria de core para estabilidade e força abdominal.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-plank-in-gym-23416-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162579/pexels-photo-4162579.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie os antebraços e as pontas dos pés no chão.",
          "Mantenha o corpo em linha reta da cabeça aos calcanhares.",
          "Contraia o abdômen, glúteos e quadríceps simultaneamente.",
          "Respire normalmente e mantenha a posição pelo tempo determinado."
        ],
        proTips: [
          "Olhe para o chão a cerca de 30 cm à frente das mãos para manter o pescoço neutro.",
          "Aumente o tempo gradualmente à medida que ganhar força."
        ],
        commonErrors: [
          "Deixar o quadril subir ou afundar.",
          "Prender a respiração durante o exercício."
        ]
      }
    ]
  }
];

export const INTERMEDIATE_WORKOUTS: Workout[] = [
  {
    id: "peito-intermediario-1",
    name: "Peito Superior",
    muscleGroup: "Peito",
    level: "Intermediário",
    duration: "50 min",
    carga: "Média",
    description: "Volume e intensidade para o peitoral superior — inclinados e crucifixo.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-18",
        name: "Supino Inclinado com Barra",
        series: 4,
        reps: "10",
        restTime: "90s",
        muscleGroup: "Peito",
        description: "Foco na parte superior do peitoral.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-incline-bench-press-23437-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838387/pexels-photo-3838387.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajuste o banco a cerca de 30 graus de inclinação.",
          "Segure a barra com pegada um pouco mais larga que a largura dos ombros.",
          "Desça a barra em direção à parte superior do peito de forma controlada.",
          "Empurre a barra de volta à posição inicial contraindo o peitoral superior."
        ],
        proTips: [
          "O ângulo de 30 graus ativa mais o peitoral superior com menos sobrecarga nos ombros.",
          "Mantenha as escápulas retraídas e deprimidas durante todo o movimento."
        ],
        commonErrors: [
          "Usar inclinação excessiva (acima de 45 graus), transferindo tensão para os ombros.",
          "Quicar a barra no peito em vez de controlar a descida.",
          "Arquear a lombar de forma exagerada."
        ]
      },
      {
        id: "ex-pro-ps-2",
        name: "Supino Inclinado com Halteres",
        series: 4,
        reps: "10-12",
        restTime: "75s",
        muscleGroup: "Peito",
        description: "Maior amplitude que a barra — máximo alongamento do peitoral superior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-chest-press-with-dumbbells-in-a-gym-23422-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838389/pexels-photo-3838389.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite no banco inclinado a 30-35 graus com os halteres nos ombros.",
          "Empurre os halteres convergindo levemente ao centro no topo.",
          "Desça além da linha do banco para aproveitar a amplitude máxima.",
          "Suba de forma controlada sem travar os cotovelos."
        ],
        proTips: [
          "Halteres permitem descer mais que a barra — explore essa amplitude.",
          "Foque em sentir o peitoral superior esticar a cada descida."
        ],
        commonErrors: [
          "Bater os halteres no topo em vez de aproximá-los com controle.",
          "Usar carga excessiva que reduz a amplitude do movimento."
        ]
      },
      {
        id: "ex-pro-ps-3",
        name: "Crucifixo Inclinado com Halteres",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Peito",
        description: "Isolamento do peitoral superior em arco — foco no alongamento.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-performing-dumbbell-chest-flys-on-a-bench-23424-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3839179/pexels-photo-3839179.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite no banco inclinado com os halteres acima do peito.",
          "Abra os braços em arco mantendo leve flexão nos cotovelos.",
          "Desça até sentir forte alongamento no peitoral superior.",
          "Feche os braços em arco contraindo o peito no topo."
        ],
        proTips: [
          "Cadência lenta na descida (3s) para maximizar o tempo sob tensão.",
          "Use carga leve — o foco é no alongamento e contração, não na força."
        ],
        commonErrors: [
          "Dobrar demais os cotovelos, convertendo o movimento em supino.",
          "Descer rápido demais sem aproveitar o alongamento."
        ]
      }
    ]
  },
  {
    id: "peito-intermediario-2",
    name: "Centro do Peito",
    muscleGroup: "Peito",
    level: "Intermediário",
    duration: "45 min",
    carga: "Média",
    description: "Supino plano e cross over para o peitoral médio com volume moderado.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-19",
        name: "Cross Over",
        series: 4,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Peito",
        description: "Mantenha a contração no pico do movimento.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-cable-crossover-23438-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838390/pexels-photo-3838390.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione-se no centro da máquina de cabos com as polias ajustadas na altura dos ombros.",
          "Segure os cabos e dê um passo à frente, inclinando levemente o tronco.",
          "Traga os cabos em arco para o centro cruzando levemente as mãos.",
          "Contraia o peito no pico e retorne lentamente à posição inicial."
        ],
        proTips: [
          "Cruze as mãos levemente no pico do movimento para máxima contração do peitoral.",
          "Mantenha uma leve flexão nos cotovelos durante todo o movimento."
        ],
        commonErrors: [
          "Dobrar demais os cotovelos, transformando em um supino.",
          "Mover os braços em linha reta em vez de em arco.",
          "Não manter tensão no cabo na fase excêntrica."
        ]
      },
      {
        id: "ex-pro-cp-2",
        name: "Supino Reto com Halteres",
        series: 4,
        reps: "10-12",
        restTime: "90s",
        muscleGroup: "Peito",
        description: "O principal movimento de força para o centro do peitoral.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-chest-press-with-dumbbells-in-a-gym-23422-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838389/pexels-photo-3838389.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se no banco plano com os halteres na altura do peito.",
          "Empurre os halteres para cima convergindo levemente ao centro.",
          "Desça além da linha do banco para amplitude máxima.",
          "Suba controlando o movimento sem travar os cotovelos."
        ],
        proTips: [
          "Mantenha os cotovelos a 45 graus para proteger os ombros.",
          "Sinta o peitoral contrair em cada subida."
        ],
        commonErrors: [
          "Abrir demais os cotovelos (formato T), sobrecarregando os ombros.",
          "Usar impulso para levantar os halteres."
        ]
      },
      {
        id: "ex-pro-cp-3",
        name: "Crucifixo Reto com Halteres",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Peito",
        description: "Alongamento e contração do peitoral médio em arco amplo.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-performing-dumbbell-chest-flys-on-a-bench-23424-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3839179/pexels-photo-3839179.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite no banco plano com os halteres acima do peito, palmas entre si.",
          "Abra os braços em arco até sentir o alongamento máximo do peitoral.",
          "Mantenha leve flexão nos cotovelos durante todo o movimento.",
          "Feche os braços em arco contraindo o centro do peito no topo."
        ],
        proTips: [
          "Não desça além da linha dos ombros para proteger os ombros.",
          "Expire ao fechar os braços para melhor contração."
        ],
        commonErrors: [
          "Transformar o movimento em supino dobrando demais os cotovelos.",
          "Descer muito rápido sem controle da fase excêntrica."
        ]
      }
    ]
  },
  {
    id: "peito-intermediario-3",
    name: "Inferior do Peito",
    muscleGroup: "Peito",
    level: "Intermediário",
    duration: "45 min",
    carga: "Média",
    description: "Movimentos declinados e dips para esculpir o peitoral inferior.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-ip-1",
        name: "Supino Declinado com Halteres",
        series: 4,
        reps: "10-12",
        restTime: "90s",
        muscleGroup: "Peito",
        description: "Amplitude superior à barra para máxima ativação do peitoral inferior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-chest-press-with-dumbbells-in-a-gym-23422-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838389/pexels-photo-3838389.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite no banco declinado com os halteres na altura do peitoral inferior.",
          "Empurre os halteres para cima convergindo ao centro.",
          "Desça além da linha do banco para amplitude máxima.",
          "Suba controlando o movimento."
        ],
        proTips: [
          "Mantenha os cotovelos a 45 graus para foco total no peitoral inferior.",
          "Halteres permitem maior amplitude — use essa vantagem."
        ],
        commonErrors: [
          "Não fixar os pés corretamente no banco antes de iniciar.",
          "Usar carga excessiva que reduz a amplitude."
        ]
      },
      {
        id: "ex-pro-ip-2",
        name: "Mergulho entre Barras Paralelas (Dips)",
        series: 4,
        reps: "10-12",
        restTime: "90s",
        muscleGroup: "Peito",
        description: "Com tronco inclinado à frente, o foco vai para o peitoral inferior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-push-ups-23444-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie as mãos nas barras paralelas e incline o tronco 15-20° à frente.",
          "Desça flexionando os cotovelos até sentir forte alongamento no peitoral inferior.",
          "Empurre de volta à posição inicial sem travar os cotovelos.",
          "Mantenha a inclinação do tronco durante toda a execução."
        ],
        proTips: [
          "Inclinação à frente = peitoral; tronco reto = tríceps.",
          "Adicione peso com um cinto de lastro quando o corporal não for mais desafio."
        ],
        commonErrors: [
          "Não inclinar o tronco, transferindo o trabalho para o tríceps.",
          "Não descer o suficiente para ativar o peitoral inferior."
        ]
      },
      {
        id: "ex-pro-ip-3",
        name: "Cross Over de Cima para Baixo",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Peito",
        description: "Polias altas direcionam a adução para o peitoral inferior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-cable-crossover-23438-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838390/pexels-photo-3838390.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajuste as polias na posição alta e segure com os braços abertos.",
          "Puxe os cabos de cima para baixo em arco, cruzando as mãos abaixo do quadril.",
          "Contraia o peitoral inferior no pico e retorne controladamente.",
          "Mantenha o tronco levemente inclinado à frente."
        ],
        proTips: [
          "Quanto mais baixo cruzar as mãos, maior o foco no peitoral inferior.",
          "Mantenha tensão no cabo durante o retorno para a fase excêntrica."
        ],
        commonErrors: [
          "Cruzar as mãos na altura do peito em vez de abaixo do quadril.",
          "Usar impulso dos ombros em vez de contrair o peitoral inferior."
        ]
      }
    ]
  },
  {
    id: "costas-pro-1",
    name: "Largura das Costas",
    muscleGroup: "Costas",
    level: "Intermediário",
    duration: "50 min",
    carga: "Média",
    description: "Puxadas com maior carga para desenvolver largura e espessura do latíssimo.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-cl-1",
        name: "Puxada Pronada (Carga Progressiva)",
        series: 4,
        reps: "10",
        restTime: "90s",
        muscleGroup: "Costas",
        description: "Aumente a carga a cada série mantendo a técnica.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lat-pulldown-exercise-in-a-gym-23427-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164761/pexels-photo-4164761.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Segure a barra com pegada pronada larga — mais que os ombros.",
          "Deprima as escápulas antes de iniciar e mantenha essa posição.",
          "Puxe a barra até a linha do queixo contraindo o latíssimo.",
          "Retorne lentamente em 3s para maximizar a fase excêntrica."
        ],
        proTips: [
          "Série 1: aquecimento. Séries 2-4: carga progressiva.",
          "Imagine que está tentando tocar os cotovelos no chão para ativar o latíssimo."
        ],
        commonErrors: [
          "Usar o impulso do corpo em vez da força das costas.",
          "Não completar a extensão dos braços na fase excêntrica."
        ]
      },
      {
        id: "ex-pro-cl-2",
        name: "Barra Fixa (Pegada Larga)",
        series: 4,
        reps: "Máximo",
        restTime: "90s",
        muscleGroup: "Costas",
        description: "O rei dos exercícios de largura — use o peso corporal completo.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lat-pulldown-exercise-in-a-gym-23427-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164761/pexels-photo-4164761.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Segure a barra com pegada pronada larga, braços totalmente estendidos.",
          "Deprima e retrai as escápulas antes de puxar.",
          "Puxe o queixo acima da barra contraindo o latíssimo.",
          "Desça lentamente à extensão completa."
        ],
        proTips: [
          "Se não conseguir repetições completas, use o elástico de assistência.",
          "Foco na qualidade — 3 reps com técnica perfeita > 10 reps com balanço."
        ],
        commonErrors: [
          "Usar impulso das pernas para subir.",
          "Não descer completamente, perdendo o alongamento do latíssimo."
        ]
      },
      {
        id: "ex-pro-cl-3",
        name: "Pullover com Halter",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Costas",
        description: "Isola o latíssimo em um plano de movimento único.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lat-pulldown-exercise-in-a-gym-23427-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164761/pexels-photo-4164761.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite transversalmente no banco com os ombros apoiados e quadril suspenso.",
          "Segure um halter com as duas mãos acima do peito.",
          "Abaixe o halter atrás da cabeça em arco sentindo o latíssimo alongar.",
          "Traga de volta à posição inicial usando a força das costas."
        ],
        proTips: [
          "Mantenha os cotovelos levemente flexionados durante todo o arco.",
          "O quadril suspenso aumenta o alongamento — aproveite."
        ],
        commonErrors: [
          "Dobrar demais os cotovelos, transformando em tríceps.",
          "Descer além do confortável, sobrecarregando os ombros."
        ]
      }
    ]
  },
  {
    id: "costas-pro-2",
    name: "Espessura das Costas",
    muscleGroup: "Costas",
    level: "Intermediário",
    duration: "50 min",
    carga: "Média",
    description: "Remadas com carga progressiva para romboides, trapézio médio e lombar.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-ce-1",
        name: "Remada Curvada com Halteres",
        series: 4,
        reps: "10 cada",
        restTime: "75s",
        muscleGroup: "Costas",
        description: "Foco em espessura — romboides e trapézio médio em sobrecarga.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Incline o tronco a 45° com os halteres pendurados abaixo do peito.",
          "Puxe os halteres em direção ao quadril retraindo as escápulas.",
          "Segure a contração por 1 segundo no pico.",
          "Desça controladamente à extensão completa."
        ],
        proTips: [
          "Lidere com os cotovelos — não com as mãos.",
          "Mantenha a coluna neutra durante todo o movimento."
        ],
        commonErrors: [
          "Usar o balanço do tronco para ajudar no movimento.",
          "Não retrair completamente as escápulas no pico."
        ]
      },
      {
        id: "ex-pro-ce-2",
        name: "Remada Baixa com Barra Reta",
        series: 4,
        reps: "10-12",
        restTime: "75s",
        muscleGroup: "Costas",
        description: "Carga superior ao triângulo — maior ativação dos romboides.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se no cabo baixo com pegada pronada na barra reta.",
          "Mantenha a coluna neutra e o tronco levemente inclinado.",
          "Puxe a barra em direção ao abdômen inferior retraindo as escápulas.",
          "Retorne lentamente à extensão completa dos braços."
        ],
        proTips: [
          "A pegada pronada ativa mais os romboides que a supinada.",
          "Mantenha o peito alto durante todo o movimento."
        ],
        commonErrors: [
          "Oscilar o tronco para frente e para trás.",
          "Arredondar a lombar ao puxar a carga."
        ]
      },
      {
        id: "ex-pro-ce-3",
        name: "Remada Unilateral com Halter",
        series: 3,
        reps: "10 cada lado",
        restTime: "60s",
        muscleGroup: "Costas",
        description: "Força unilateral para corrigir assimetrias nas costas.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie joelho e mão no banco com tronco paralelo ao chão.",
          "Segure o halter com braço estendido abaixo do ombro.",
          "Puxe o halter em direção ao quadril, cotovelo junto ao corpo.",
          "Desça controladamente à extensão completa."
        ],
        proTips: [
          "Use carga que permita completar as reps com técnica impecável.",
          "Contraia a escápula no pico por 1 segundo."
        ],
        commonErrors: [
          "Rodar excessivamente o tronco para usar impulso.",
          "Puxar em direção ao ombro em vez do quadril."
        ]
      }
    ]
  },
  {
    id: "pernas-pro-1",
    name: "Quadríceps",
    muscleGroup: "Pernas",
    level: "Intermediário",
    duration: "55 min",
    carga: "Alta",
    description: "Protocolos de alta intensidade para a frente da coxa.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-20",
        name: "Agachamento Búlgaro",
        series: 4,
        reps: "10 cada",
        restTime: "90s",
        muscleGroup: "Pernas",
        description: "Foco em equilíbrio e força unilateral no quadríceps.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-bulgarian-split-squat-23439-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162454/pexels-photo-4162454.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie o pé traseiro em um banco ou superfície elevada atrás de você.",
          "Posicione o pé da frente à frente o suficiente para manter o joelho atrás da linha dos dedos.",
          "Desça o quadril em direção ao chão flexionando o joelho da frente a 90 graus.",
          "Empurre com o calcanhar do pé da frente para retornar à posição inicial."
        ],
        proTips: [
          "Tronco ereto = mais quadríceps. Tronco inclinado = mais glúteos.",
          "Segure halteres nas laterais para aumentar a carga."
        ],
        commonErrors: [
          "Deixar o joelho da frente colapsar para dentro.",
          "Posicionar o pé da frente muito perto do banco, sobrecarregando o joelho.",
          "Não atingir a profundidade suficiente."
        ]
      },
      {
        id: "ex-pro-q-2",
        name: "Leg Press 45 (Pés Baixos)",
        series: 4,
        reps: "10-12",
        restTime: "90s",
        muscleGroup: "Pernas",
        description: "Pés baixos na plataforma = foco máximo no quadríceps.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-leg-press-in-gym-23429-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837781/pexels-photo-3837781.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione os pés na parte baixa da plataforma na largura dos ombros.",
          "Empurre sem travar os joelhos no topo.",
          "Desça até as coxas ficarem abaixo do paralelo para máxima ativação.",
          "Empurre explosivamente de volta ao topo."
        ],
        proTips: [
          "Pés baixos = quadríceps. Pés altos = glúteos.",
          "Use amplitude máxima — coxas passando do paralelo."
        ],
        commonErrors: [
          "Travar os joelhos no topo.",
          "Retirar o quadril do assento na descida."
        ]
      },
      {
        id: "ex-pro-q-3",
        name: "Cadeira Extensora (Drop-set)",
        series: 3,
        reps: "12+12",
        restTime: "75s",
        muscleGroup: "Pernas",
        description: "Drop-set para exaustão total do quadríceps — sem descanso entre as cargas.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-leg-extensions-23430-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837757/pexels-photo-3837757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Execute 12 reps na carga normal com técnica perfeita.",
          "Reduza imediatamente a carga em 30% sem descanso.",
          "Execute mais 12 reps até a falha.",
          "Contraia o quadríceps no pico de cada repetição por 1 segundo."
        ],
        proTips: [
          "Tenha um parceiro para ajustar o pino da carga rapidamente.",
          "A cadência lenta na descida maximiza a ativação do quadríceps."
        ],
        commonErrors: [
          "Descansar entre as reduções de carga, quebrando o drop-set.",
          "Usar impulso para completar as últimas reps."
        ]
      }
    ]
  },
  {
    id: "pernas-pro-2",
    name: "Posterior e Glúteos",
    muscleGroup: "Pernas",
    level: "Intermediário",
    duration: "55 min",
    carga: "Alta",
    description: "Isquiotibiais e glúteos com carga e volume intermediários.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-pg-1",
        name: "Stiff com Barra",
        series: 4,
        reps: "10",
        restTime: "90s",
        muscleGroup: "Pernas",
        description: "Carga superior ao halter — máximo alongamento dos isquiotibiais.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-deadlift-exercise-23441-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162587/pexels-photo-4162587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé com a barra na frente das coxas, joelhos levemente flexionados.",
          "Empurre o quadril para trás mantendo a coluna neutra.",
          "Desça a barra próxima às pernas até sentir forte tensão nos isquiotibiais.",
          "Contraia os glúteos e isquiotibiais para retornar à posição inicial."
        ],
        proTips: [
          "A barra deve roçar as pernas durante todo o movimento.",
          "Quanto mais se inclinar mantendo a coluna neutra, maior o estímulo."
        ],
        commonErrors: [
          "Arredondar a lombar na fase mais baixa.",
          "Dobrar demais os joelhos, transformando em levantamento terra."
        ]
      },
      {
        id: "ex-pro-pg-2",
        name: "Hip Thrust com Barra",
        series: 4,
        reps: "12",
        restTime: "75s",
        muscleGroup: "Pernas",
        description: "O melhor exercício para glúteos com carga progressiva.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-23425-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162438/pexels-photo-4162438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie as escápulas no banco com a barra sobre o quadril.",
          "Pés na largura dos quadris, joelhos a 90 graus no topo.",
          "Desça o quadril em direção ao chão e empurre explosivamente para cima.",
          "Contraia os glúteos no pico e segure por 2 segundos."
        ],
        proTips: [
          "Use um pad para conforto com cargas maiores.",
          "No topo, o tronco deve estar paralelo ao chão."
        ],
        commonErrors: [
          "Arquear a lombar no topo em vez de contrair os glúteos.",
          "Posicionar os pés muito longe, sobrecarregando os isquiotibiais."
        ]
      },
      {
        id: "ex-pro-pg-3",
        name: "Cadeira Flexora",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Pernas",
        description: "Isolamento dos isquiotibiais com controle excêntrico.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-leg-extensions-23430-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837757/pexels-photo-3837757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite na máquina com o apoio sobre os tornozelos e joelhos alinhados ao eixo.",
          "Flexione os joelhos trazendo o apoio em direção aos glúteos.",
          "Contraia os isquiotibiais no pico e segure por 1 segundo.",
          "Desça em 3 segundos resistindo à carga."
        ],
        proTips: [
          "Cadência 2-1-3 (subida, pausa, descida) maximiza o tempo sob tensão.",
          "Pressione o quadril contra o banco para isolar os isquiotibiais."
        ],
        commonErrors: [
          "Levantar o quadril para completar as reps.",
          "Descer rápido demais sem controlar a fase excêntrica."
        ]
      }
    ]
  },
  {
    id: "ombros-pro-1",
    name: "Deltoide Anterior e Medial",
    muscleGroup: "Ombros",
    level: "Intermediário",
    duration: "45 min",
    carga: "Média",
    description: "Desenvolvimento e elevações com carga progressiva para volume nos ombros.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-om-1",
        name: "Desenvolvimento Arnold",
        series: 4,
        reps: "10",
        restTime: "75s",
        muscleGroup: "Ombros",
        description: "Rotação no desenvolvimento para ativar todas as cabeças do deltoide.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-dumbbell-shoulder-press-23431-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837793/pexels-photo-3837793.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Comece com os halteres à frente do peito, palmas voltadas para você.",
          "Ao empurrar para cima, gire as palmas para frente simultaneamente.",
          "No topo, as palmas ficam voltadas para frente com os braços estendidos.",
          "Desça invertendo o movimento de rotação."
        ],
        proTips: [
          "A rotação ativa o deltoide anterior e medial em uma amplitude maior.",
          "Execute lentamente para sentir cada fase da rotação."
        ],
        commonErrors: [
          "Fazer a rotação muito rápida, perdendo a ativação progressiva.",
          "Arquear a lombar ao empurrar no topo."
        ]
      },
      {
        id: "ex-pro-om-2",
        name: "Elevação Lateral com Cabos",
        series: 4,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Ombros",
        description: "Tensão constante no deltoide medial — superior ao halter.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lateral-raises-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837799/pexels-photo-3837799.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Segure o cabo cruzando o corpo (mão direita no cabo esquerdo).",
          "Eleve o braço até a altura do ombro com leve flexão no cotovelo.",
          "Segure no pico por 1 segundo e desça controladamente.",
          "Complete todas as reps de um lado antes de trocar."
        ],
        proTips: [
          "O cabo cruzado mantém tensão no início do movimento — o halter não.",
          "Gire levemente o polegar para baixo no pico para ativar mais o medial."
        ],
        commonErrors: [
          "Elevar acima dos ombros, recrutando o trapézio.",
          "Usar impulso do corpo para elevar o cabo."
        ]
      },
      {
        id: "ex-pro-om-3",
        name: "Elevação Frontal com Barra",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Ombros",
        description: "Sobrecarga do deltoide anterior com estabilidade da barra.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-dumbbell-shoulder-press-23431-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837793/pexels-photo-3837793.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Segure a barra com pegada pronada na largura dos ombros.",
          "Eleve a barra à frente até a altura dos ombros com braços levemente flexionados.",
          "Segure no topo por 1 segundo.",
          "Desça lentamente em 2-3 segundos."
        ],
        proTips: [
          "A barra permite mais carga que os halteres para o deltoide anterior.",
          "Não suba além dos ombros — o trapézio assume o movimento."
        ],
        commonErrors: [
          "Usar o tronco para criar impulso na subida.",
          "Subir acima da linha dos ombros."
        ]
      }
    ]
  },
  {
    id: "ombros-pro-2",
    name: "Deltoide Posterior",
    muscleGroup: "Ombros",
    level: "Intermediário",
    duration: "40 min",
    carga: "Média",
    description: "Foco total na cabeça posterior do deltoide — saúde articular e estética.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-op-1",
        name: "Crucifixo Inverso com Halteres (Inclinado 90°)",
        series: 4,
        reps: "15",
        restTime: "60s",
        muscleGroup: "Ombros",
        description: "Tronco a 90 graus isola completamente o deltoide posterior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lateral-raises-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837799/pexels-photo-3837799.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Incline o tronco a 90 graus com os halteres pendurados abaixo do peito.",
          "Mantenha o pescoço neutro olhando para baixo.",
          "Eleve os braços para os lados até a linha dos ombros.",
          "Desça lentamente sentindo o deltoide posterior trabalhar."
        ],
        proTips: [
          "Use cargas muito leves — o deltoide posterior é um músculo pequeno.",
          "Foque na contração no pico, não na carga."
        ],
        commonErrors: [
          "Usar o trapézio para elevar os halteres.",
          "Dobrar demais os cotovelos durante o arco."
        ]
      },
      {
        id: "ex-pro-op-2",
        name: "Face Pull com Corda",
        series: 4,
        reps: "15",
        restTime: "60s",
        muscleGroup: "Ombros",
        description: "Deltoide posterior e rotadores externos — prevenção de lesões.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-tricep-pushdowns-23434-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164767/pexels-photo-4164767.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajuste o cabo na altura dos olhos com a corda.",
          "Puxe a corda em direção ao rosto separando as mãos ao final.",
          "Mantenha os cotovelos altos e acima dos ombros.",
          "Retorne controladamente à posição inicial."
        ],
        proTips: [
          "Execute em todo treino de ombros para saúde articular a longo prazo.",
          "Separe as mãos ao máximo no pico para rotação externa completa."
        ],
        commonErrors: [
          "Deixar os cotovelos caírem abaixo dos ombros.",
          "Puxar muito rápido sem sentir a contração do deltoide posterior."
        ]
      },
      {
        id: "ex-pro-op-3",
        name: "Peck Deck Inverso",
        series: 3,
        reps: "15",
        restTime: "45s",
        muscleGroup: "Ombros",
        description: "Isolamento seguro do deltoide posterior na máquina.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lateral-raises-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837799/pexels-photo-3837799.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se de frente para o encosto da máquina peck deck.",
          "Ajuste os apoios na altura dos ombros com os cotovelos levemente dobrados.",
          "Abra os braços para os lados até sentir contração no deltoide posterior.",
          "Retorne lentamente à posição inicial."
        ],
        proTips: [
          "Use amplitude total para maximizar o recrutamento.",
          "Cadência lenta tanto na ida quanto na volta."
        ],
        commonErrors: [
          "Usar carga alta que faz o trapézio dominar.",
          "Não completar o arco, reduzindo a ativação."
        ]
      }
    ]
  },
  {
    id: "bracos-pro-1",
    name: "Bíceps",
    muscleGroup: "Braços",
    level: "Intermediário",
    duration: "40 min",
    carga: "Média",
    description: "Volume e variações para desenvolvimento completo dos bíceps.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-bi-1",
        name: "Rosca Direta com Barra",
        series: 4,
        reps: "10",
        restTime: "75s",
        muscleGroup: "Braços",
        description: "Maior carga que os halteres — força máxima nos bíceps.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-dumbbell-bicep-curls-23433-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164766/pexels-photo-4164766.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Segure a barra com pegada supinada na largura dos ombros.",
          "Mantenha os cotovelos fixos ao lado do tronco.",
          "Flexione os cotovelos trazendo a barra até os ombros.",
          "Desça lentamente em 3 segundos."
        ],
        proTips: [
          "A barra permite mais carga — ideal para ganho de força e volume.",
          "Use a barra EZ para menos tensão nos pulsos."
        ],
        commonErrors: [
          "Balançar o tronco para ajudar a levantar.",
          "Levar os cotovelos para frente na subida."
        ]
      },
      {
        id: "ex-pro-bi-2",
        name: "Rosca Concentrada",
        series: 3,
        reps: "10 cada lado",
        restTime: "60s",
        muscleGroup: "Braços",
        description: "Pico de contração máximo — isolamento total do bíceps.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-dumbbell-bicep-curls-23433-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164766/pexels-photo-4164766.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se com o cotovelo apoiado na parte interna da coxa.",
          "Segure o halter com pegada supinada e braço totalmente estendido.",
          "Flexione o cotovelo trazendo o halter ao ombro.",
          "Contraia o bíceps no pico e segure por 2 segundos."
        ],
        proTips: [
          "O apoio na coxa elimina qualquer impulso — isolamento total.",
          "Gire o punho para fora no pico para máxima supinação."
        ],
        commonErrors: [
          "Mover o cotovelo durante a execução.",
          "Não atingir a extensão completa na descida."
        ]
      },
      {
        id: "ex-pro-bi-3",
        name: "Rosca Martelo com Corda (Cabo)",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Braços",
        description: "Tensão constante no bíceps e braquial com a corda no cabo.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-dumbbell-bicep-curls-23433-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164766/pexels-photo-4164766.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Prenda a corda no cabo baixo e segure com pegada neutra.",
          "Mantenha os cotovelos fixos ao lado do corpo.",
          "Flexione os cotovelos trazendo a corda em direção aos ombros.",
          "Desça controladamente à extensão completa."
        ],
        proTips: [
          "O cabo mantém tensão em todo o arco — diferente do halter.",
          "Execute de forma alternada para maior concentração."
        ],
        commonErrors: [
          "Deixar os cotovelos se afastarem do corpo.",
          "Não estender completamente os cotovelos no final."
        ]
      }
    ]
  },
  {
    id: "bracos-pro-2",
    name: "Tríceps",
    muscleGroup: "Braços",
    level: "Intermediário",
    duration: "40 min",
    carga: "Média",
    description: "Volume e variações para as três cabeças do tríceps.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-tr-1",
        name: "Tríceps Francês com Barra EZ",
        series: 4,
        reps: "10",
        restTime: "75s",
        muscleGroup: "Braços",
        description: "Ativa especialmente a cabeça longa do tríceps com carga alta.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-tricep-pushdowns-23434-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164767/pexels-photo-4164767.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite no banco plano segurando a barra EZ acima da cabeça.",
          "Mantenha os cotovelos apontados para o teto e fixos.",
          "Flexione os cotovelos descendo a barra próxima à testa.",
          "Estenda de volta à posição inicial."
        ],
        proTips: [
          "Cotovelos perpendiculares ao chão = máxima ativação da cabeça longa.",
          "EZ bar reduz a tensão nos pulsos em comparação com a barra reta."
        ],
        commonErrors: [
          "Abrir os cotovelos para os lados durante o movimento.",
          "Usar carga excessiva que compromete os cotovelos."
        ]
      },
      {
        id: "ex-pro-tr-2",
        name: "Tríceps Pulley com Corda",
        series: 4,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Braços",
        description: "A corda permite rotação do punho no final — maior contração.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-tricep-pushdowns-23434-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164767/pexels-photo-4164767.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Segure a corda com os cotovelos a 90 graus fixos ao lado do corpo.",
          "Empurre a corda para baixo e separe as mãos no final do movimento.",
          "Contraia o tríceps no pico por 1 segundo.",
          "Retorne controladamente à posição inicial."
        ],
        proTips: [
          "Separar a corda no final ativa mais as cabeças lateral e medial.",
          "Incline levemente o tronco para frente para melhor posicionamento."
        ],
        commonErrors: [
          "Mover os cotovelos para frente durante a extensão.",
          "Não separar a corda no final, perdendo a contração extra."
        ]
      },
      {
        id: "ex-pro-tr-3",
        name: "Mergulho entre Bancos com Carga",
        series: 3,
        reps: "10-12",
        restTime: "75s",
        muscleGroup: "Braços",
        description: "Adicione peso sobre as coxas para sobrecarga progressiva.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-push-ups-23444-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie as mãos em um banco atrás e pés em outro banco à frente.",
          "Coloque um anilho ou halter sobre as coxas.",
          "Desça flexionando os cotovelos até 90 graus.",
          "Empurre de volta à posição inicial mantendo o tronco ereto."
        ],
        proTips: [
          "Tronco ereto = máximo foco no tríceps.",
          "Aumente a carga progressivamente a cada semana."
        ],
        commonErrors: [
          "Deixar o tronco afastar do banco.",
          "Não descer o suficiente para ativar completamente o tríceps."
        ]
      }
    ]
  },
  {
    id: "abdomen-pro-1",
    name: "Abdominal Superior",
    muscleGroup: "Abdômen",
    level: "Intermediário",
    duration: "30 min",
    carga: "Baixa",
    description: "Volume e variações para o reto abdominal superior.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-as-1",
        name: "Abdominal na Polia (Corda)",
        series: 4,
        reps: "15",
        restTime: "45s",
        muscleGroup: "Abdômen",
        description: "Resistência progressiva para o abdômen — superior ao crunch normal.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crunches-23435-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajoelhe-se à frente do cabo alto segurando a corda atrás da cabeça.",
          "Contraia o abdômen curvando o tronco em direção aos joelhos.",
          "Tire apenas o tronco — não puxe com os braços.",
          "Retorne lentamente à posição inicial."
        ],
        proTips: [
          "A polia permite adicionar carga progressivamente.",
          "Foque no enrolamento do tronco — não no movimento dos braços."
        ],
        commonErrors: [
          "Puxar a corda com os braços em vez de contrair o abdômen.",
          "Usar carga excessiva que compromete a técnica."
        ]
      },
      {
        id: "ex-pro-as-2",
        name: "Abdominal com Rotação (Bike Crunch)",
        series: 3,
        reps: "20",
        restTime: "30s",
        muscleGroup: "Abdômen",
        description: "Oblíquos e reto abdominal em um único movimento.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crunches-23435-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite com as mãos atrás da cabeça e pernas suspensas com joelhos a 90 graus.",
          "Traga o cotovelo direito ao joelho esquerdo enquanto estende a perna direita.",
          "Alterne os lados em movimento contínuo sem descansar.",
          "Mantenha o core contraído durante toda a série."
        ],
        proTips: [
          "Controle o ritmo — não é uma corrida, é uma contração.",
          "Expire em cada rotação para melhor ativação do core."
        ],
        commonErrors: [
          "Girar o pescoço em vez do tronco.",
          "Não estender completamente a perna oposta."
        ]
      },
      {
        id: "ex-pro-as-3",
        name: "Prancha com Elevação de Braço",
        series: 3,
        reps: "10 cada lado",
        restTime: "45s",
        muscleGroup: "Abdômen",
        description: "Estabilidade anti-rotacional — core avançado.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-plank-exercise-23436-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757954/pexels-photo-3757954.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione-se em prancha alta com os braços estendidos.",
          "Mantenha o quadril nivelado e o core rigidamente contraído.",
          "Eleve um braço à frente sem deixar o quadril rotar.",
          "Retorne e repita do outro lado."
        ],
        proTips: [
          "Afaste os pés para maior estabilidade durante o exercício.",
          "Quanto mais lento, mais difícil e mais eficaz."
        ],
        commonErrors: [
          "Deixar o quadril rotar quando eleva o braço.",
          "Perder o alinhamento da coluna durante o movimento."
        ]
      }
    ]
  },
  {
    id: "abdomen-pro-2",
    name: "Abdominal Inferior e Oblíquos",
    muscleGroup: "Abdômen",
    level: "Intermediário",
    duration: "30 min",
    carga: "Baixa",
    description: "Elevação de pernas e rotações para a parte inferior e lateral do abdômen.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-ao-1",
        name: "Elevação de Pernas na Barra",
        series: 4,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Abdômen",
        description: "O exercício mais completo para o abdominal inferior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crunches-23435-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Pendure-se na barra com as mãos e o corpo relaxado.",
          "Contraia o abdômen e eleve as pernas até a posição horizontal.",
          "Para avançado: eleve até 90 graus tocando a barra com os pés.",
          "Desça lentamente sem balançar o corpo."
        ],
        proTips: [
          "Não use impulso — cada elevação deve ser controlada.",
          "Pernas juntas e joelhos levemente flexionados para iniciantes neste exercício."
        ],
        commonErrors: [
          "Balançar o corpo para usar impulso.",
          "Não contrair o abdômen antes de elevar."
        ]
      },
      {
        id: "ex-pro-ao-2",
        name: "Russian Twist com Peso",
        series: 3,
        reps: "20",
        restTime: "45s",
        muscleGroup: "Abdômen",
        description: "Oblíquos com resistência — anilha ou halter.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crunches-23435-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se com pés elevados e tronco a 45 graus segurando uma anilha.",
          "Gire o tronco de um lado ao outro tocando a anilha no chão.",
          "Mantenha o core contraído e a coluna neutra.",
          "Execute de forma controlada — qualidade sobre velocidade."
        ],
        proTips: [
          "Pés elevados aumentam significativamente a dificuldade.",
          "A rotação deve vir do tronco, não dos braços."
        ],
        commonErrors: [
          "Girar apenas os braços sem rotar o tronco.",
          "Inclinar excessivamente para trás, sobrecarregando a lombar."
        ]
      },
      {
        id: "ex-pro-ao-3",
        name: "Prancha Lateral com Elevação de Quadril",
        series: 3,
        reps: "12 cada lado",
        restTime: "45s",
        muscleGroup: "Abdômen",
        description: "Oblíquos em contração dinâmica — mais intenso que a prancha lateral estática.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-plank-exercise-23436-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757954/pexels-photo-3757954.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione-se em prancha lateral com o antebraço no chão.",
          "Deixe o quadril tocar levemente o chão.",
          "Empurre o quadril para cima contraindo os oblíquos.",
          "Repita o movimento de forma controlada antes de trocar de lado."
        ],
        proTips: [
          "Movimento lento e controlado — não é um balanço lateral.",
          "Mantenha o corpo alinhado — sem rotar o tronco."
        ],
        commonErrors: [
          "Deixar o quadril cair sem controle na descida.",
          "Rotar o tronco para cima durante a elevação."
        ]
      }
    ]
  },
  {
    id: "costas-pro-3",
    name: "Força das Costas",
    muscleGroup: "Costas",
    level: "Intermediário",
    duration: "50 min",
    carga: "Alta",
    description: "Remadas e puxadas de alta carga para força máxima nas costas.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-cf-1",
        name: "Remada Curvada com Barra",
        series: 4,
        reps: "8",
        restTime: "90s",
        muscleGroup: "Costas",
        description: "Remada inclinada para espessura máxima do dorsal.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé com os pés na largura dos ombros, segure a barra com pegada pronada.",
          "Incline o tronco a 45 graus mantendo a coluna neutra e joelhos levemente flexionados.",
          "Puxe a barra em direção ao umbigo, retraindo as escápulas no topo.",
          "Desça de forma controlada até os braços ficarem quase estendidos."
        ],
        proTips: [
          "Imagine que está tentando 'amassar uma laranja' com as escápulas no topo.",
          "Mantenha o pescoço neutro — olhe para um ponto no chão à sua frente."
        ],
        commonErrors: [
          "Arredondar a lombar sob carga pesada.",
          "Usar o impulso do tronco para erguer a barra."
        ]
      },
      {
        id: "ex-pro-cf-2",
        name: "Puxada Supinada",
        series: 4,
        reps: "10",
        restTime: "75s",
        muscleGroup: "Costas",
        description: "Puxada com pegada invertida para ativar mais o latíssimo e bíceps.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-a-pull-up-exercise-23430-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162581/pexels-photo-4162581.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Segure a barra de puxada com a pegada supinada (palmas para você), mãos na largura dos ombros.",
          "Puxe em direção ao queixo contraindo o latíssimo e os bíceps.",
          "No topo, mantenha os cotovelos apontados para baixo e as escápulas retraídas.",
          "Desça lentamente até os braços ficarem completamente estendidos."
        ],
        proTips: [
          "A pegada supinada proporciona maior amplitude de movimento.",
          "Inicie o movimento retraindo as escápulas antes de puxar."
        ],
        commonErrors: [
          "Usar impulso do corpo para completar as repetições.",
          "Não atingir a extensão completa na descida."
        ]
      },
      {
        id: "ex-pro-cf-3",
        name: "Pullover com Halter",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Costas",
        description: "Isolamento do latíssimo com grande amplitude — expande a caixa torácica.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se transversalmente no banco, com os ombros apoiados e o quadril suspenso.",
          "Segure um halter com ambas as mãos acima do peito, cotovelos levemente flexionados.",
          "Desça o halter em arco atrás da cabeça até sentir o alongamento máximo do latíssimo.",
          "Retorne à posição inicial usando a força das costas, não os braços."
        ],
        proTips: [
          "O peso deve ser moderado — amplitude é mais importante que carga.",
          "Inspire profundamente ao descer para expandir ao máximo a caixa torácica."
        ],
        commonErrors: [
          "Dobrar excessivamente os cotovelos transformando em exercício de tríceps.",
          "Usar carga muito pesada sacrificando a amplitude."
        ]
      }
    ]
  },
  {
    id: "pernas-pro-3",
    name: "Quadríceps & Glúteos Pro",
    muscleGroup: "Pernas",
    level: "Intermediário",
    duration: "55 min",
    carga: "Alta",
    description: "Protocolo avançado para desenvolvimento de quadríceps e glúteos.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-pq-1",
        name: "Leg Press 45°",
        series: 4,
        reps: "12",
        restTime: "90s",
        muscleGroup: "Pernas",
        description: "Agachamento na máquina para sobrecarga segura nos quadríceps.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-23425-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162438/pexels-photo-4162438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se no leg press com os pés na plataforma na largura dos ombros.",
          "Desça a plataforma controladamente até os joelhos formarem 90 graus.",
          "Empurre a plataforma de volta sem travar completamente os joelhos no topo.",
          "Mantenha a lombar encostada no encosto durante todo o movimento."
        ],
        proTips: [
          "Pés mais altos na plataforma ativam mais os glúteos e posteriores.",
          "Pés mais baixos intensificam o trabalho dos quadríceps."
        ],
        commonErrors: [
          "Deixar os joelhos colapsarem durante o empurrão.",
          "Retirar a lombar do encosto ao descer com carga pesada."
        ]
      },
      {
        id: "ex-pro-pq-2",
        name: "Avanço com Halteres",
        series: 4,
        reps: "10 cada perna",
        restTime: "75s",
        muscleGroup: "Pernas",
        description: "Exercício unilateral para equilíbrio e força funcional.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-23425-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162438/pexels-photo-4162438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé segurando um halter em cada mão ao lado do corpo.",
          "Dê um passo à frente e desça o joelho traseiro em direção ao chão.",
          "O joelho da frente deve ficar alinhado com o tornozelo — não ultrapasse.",
          "Empurre com o calcanhar da frente para voltar à posição inicial."
        ],
        proTips: [
          "Mantenha o tronco ereto durante todo o movimento.",
          "Alterne as pernas de forma controlada — sem pressa."
        ],
        commonErrors: [
          "Deixar o joelho da frente ultrapassar a ponta dos pés.",
          "Inclinar excessivamente o tronco para frente."
        ]
      },
      {
        id: "ex-pro-pq-3",
        name: "Cadeira Extensora",
        series: 3,
        reps: "15",
        restTime: "60s",
        muscleGroup: "Pernas",
        description: "Isolamento do quadríceps em amplitude completa.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-23425-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162438/pexels-photo-4162438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se na cadeira extensora com os pés posicionados sob o rolo.",
          "Estenda as pernas até a posição horizontal, contraindo o quadríceps no topo.",
          "Segure a contração por 1 segundo antes de descer.",
          "Desça lentamente até 90 graus — não solte o peso."
        ],
        proTips: [
          "Fase excêntrica lenta (3-4 segundos) maximiza o crescimento muscular.",
          "Mantenha os pés em posição neutra para trabalho equilibrado do quadríceps."
        ],
        commonErrors: [
          "Usar impulso do tronco para erguer o peso.",
          "Não atingir a extensão completa no topo."
        ]
      }
    ]
  },
  {
    id: "ombros-pro-3",
    name: "Ombros 360°",
    muscleGroup: "Ombros",
    level: "Intermediário",
    duration: "45 min",
    carga: "Média",
    description: "Protocolo completo para desenvolver as três cabeças do deltóide.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-o3-1",
        name: "Desenvolvimento Arnold",
        series: 4,
        reps: "10",
        restTime: "75s",
        muscleGroup: "Ombros",
        description: "Variação rotacional que ativa todas as cabeças do deltóide.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-shoulder-press-with-dumbbells-23431-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162579/pexels-photo-4162579.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se com os halteres na frente do peito, palmas voltadas para você.",
          "Ao empurrar para cima, rotacione os pulsos de forma que as palmas fiquem para fora no topo.",
          "Estenda completamente os braços sem travar os cotovelos.",
          "Reverta o movimento descendo de forma controlada com a rotação."
        ],
        proTips: [
          "A rotação ativa o deltóide anterior, medial e posterior sequencialmente.",
          "Movimento fluido — não quebre a rotação em duas fases distintas."
        ],
        commonErrors: [
          "Fazer a rotação muito tarde (apenas no final do movimento).",
          "Usar carga excessiva que compromete a amplitude de rotação."
        ]
      },
      {
        id: "ex-pro-o3-2",
        name: "Elevação Lateral com Cabo",
        series: 4,
        reps: "15",
        restTime: "60s",
        muscleGroup: "Ombros",
        description: "Cabo mantém tensão constante no deltóide medial — superior ao halter.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-shoulder-press-with-dumbbells-23431-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162579/pexels-photo-4162579.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique ao lado da polia baixa e segure o cabo com a mão oposta ao aparelho.",
          "Eleve o braço lateralmente até a altura dos ombros mantendo o cotovelo levemente flexionado.",
          "Mantenha o polegar levemente apontado para baixo para maior ativação do deltóide medial.",
          "Desça lentamente resistindo à tensão do cabo."
        ],
        proTips: [
          "O cabo cria tensão constante durante todo o movimento, ao contrário do halter.",
          "Incline ligeiramente o tronco para longe da polia para maior amplitude."
        ],
        commonErrors: [
          "Elevar o braço além da altura dos ombros — ativa os trapézios.",
          "Usar impulso do corpo para completar as repetições."
        ]
      },
      {
        id: "ex-pro-o3-3",
        name: "Face Pull",
        series: 3,
        reps: "15",
        restTime: "60s",
        muscleGroup: "Ombros",
        description: "Saúde do manguito rotador e ativação do deltóide posterior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-shoulder-press-with-dumbbells-23431-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162579/pexels-photo-4162579.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajuste a polia na altura do rosto e use a corda dupla.",
          "Puxe a corda em direção ao rosto separando as mãos no final do movimento.",
          "Cotovelos devem ficar acima dos ombros no ponto final.",
          "Retorne lentamente à posição inicial mantendo a tensão."
        ],
        proTips: [
          "Exercício essencial para saúde dos ombros — não negligencie.",
          "Foco na retração e depressão das escápulas durante o movimento."
        ],
        commonErrors: [
          "Puxar abaixo da linha dos ombros — vira remada, não face pull.",
          "Usar carga excessiva que impede a rotação externa completa."
        ]
      }
    ]
  },
  {
    id: "bracos-pro-3",
    name: "Braços de Ferro",
    muscleGroup: "Braços",
    level: "Intermediário",
    duration: "45 min",
    carga: "Média",
    description: "Superset de bíceps e tríceps para máximo pump e volume.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-bf-1",
        name: "Rosca Concentrada",
        series: 4,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Braços",
        description: "Isolamento máximo do bíceps com pico de contração.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-curling-dumbbells-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162514/pexels-photo-4162514.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se em um banco e apoie o cotovelo na parte interna da coxa.",
          "Segure o halter com a palma virada para cima e o braço quase estendido.",
          "Flexione o cotovelo levando o halter até o ombro, girando levemente o pulso.",
          "Desça lentamente até quase a extensão completa."
        ],
        proTips: [
          "No topo do movimento, contraia o bíceps ao máximo por 1 segundo.",
          "Mantenha o cotovelo fixo na coxa — não deixe elevar."
        ],
        commonErrors: [
          "Elevar o cotovelo da coxa para 'ajudar' com carga pesada.",
          "Não completar a extensão na descida, perdendo amplitude."
        ]
      },
      {
        id: "ex-pro-bf-2",
        name: "Tríceps Testa com Barra EZ",
        series: 4,
        reps: "10",
        restTime: "75s",
        muscleGroup: "Braços",
        description: "Extensão de tríceps em decúbito — máxima ativação da cabeça longa.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-curling-dumbbells-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162514/pexels-photo-4162514.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se no banco plano segurando a barra EZ acima do peito com braços estendidos.",
          "Flexione apenas os cotovelos abaixando a barra em direção à testa.",
          "Mantenha os cotovelos apontados para o teto — não os abra.",
          "Estenda os braços de volta à posição inicial contraindo os tríceps."
        ],
        proTips: [
          "Cotovelos levemente inclinados para trás ativa mais a cabeça longa do tríceps.",
          "Movimento controlado — não deixe a barra 'cair' em direção à testa."
        ],
        commonErrors: [
          "Abrir os cotovelos durante o movimento, perdendo o isolamento.",
          "Usar carga excessiva que compromete o controle do movimento."
        ]
      },
      {
        id: "ex-pro-bf-3",
        name: "Martelo Alternado",
        series: 3,
        reps: "12 cada",
        restTime: "60s",
        muscleGroup: "Braços",
        description: "Ativa o braquial e braquiorradial além do bíceps.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-curling-dumbbells-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162514/pexels-photo-4162514.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé com os halteres ao lado do corpo, palmas voltadas para o tronco.",
          "Flexione um cotovelo de cada vez sem rotacionar o pulso.",
          "Suba até o halter chegar à altura do ombro.",
          "Desça controladamente antes de iniciar o outro lado."
        ],
        proTips: [
          "A pegada neutra (martelo) ativa músculos que a rosca tradicional não alcança.",
          "Mantenha os cotovelos próximos ao tronco durante todo o movimento."
        ],
        commonErrors: [
          "Balançar o tronco para dar impulso.",
          "Rotar o pulso transformando em rosca tradicional."
        ]
      }
    ]
  },
  {
    id: "abdomen-pro-3",
    name: "Core de Alta Intensidade",
    muscleGroup: "Abdômen",
    level: "Intermediário",
    duration: "30 min",
    carga: "Média",
    description: "Protocolo de core com alta tensão e estabilidade para resultados avançados.",
    planRequired: "Pro",
    authorUid: "system",
    exercises: [
      {
        id: "ex-pro-ac-1",
        name: "Abdominal na Polia Alta",
        series: 4,
        reps: "15",
        restTime: "60s",
        muscleGroup: "Abdômen",
        description: "Crunch com resistência progressiva — tensão constante no abdominal.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crunches-23435-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajoelhe-se de frente para a polia alta segurando a corda atrás da cabeça.",
          "Contraia o abdômen e flexione o tronco em direção aos joelhos.",
          "A resistência deve vir do abdômen — não do pescoço ou braços.",
          "Retorne à posição inicial de forma controlada."
        ],
        proTips: [
          "Imagine que está tentando tocar o umbigo nos joelhos.",
          "Adicione carga progressivamente para continuar evoluindo."
        ],
        commonErrors: [
          "Puxar com os braços em vez de contrair o abdômen.",
          "Fazer o movimento muito rápido perdendo a tensão muscular."
        ]
      },
      {
        id: "ex-pro-ac-2",
        name: "Roda Abdominal (Ab Wheel)",
        series: 3,
        reps: "10",
        restTime: "75s",
        muscleGroup: "Abdômen",
        description: "Um dos exercícios mais desafiadores para o core completo.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crunches-23435-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajoelhe-se com a roda abdominal à sua frente, mãos na alça.",
          "Role para frente lentamente estendendo os quadris e mantendo o core rígido.",
          "Vá até onde conseguir manter o controle — sem arquear a lombar.",
          "Retorne puxando com o abdômen e os dorsais simultaneamente."
        ],
        proTips: [
          "Comece com amplitude reduzida e aumente gradualmente.",
          "Contrair o glúteo durante o movimento protege a lombar."
        ],
        commonErrors: [
          "Arquear a lombar durante a extensão — risco de lesão.",
          "Avançar além da capacidade atual de controle."
        ]
      },
      {
        id: "ex-pro-ac-3",
        name: "Bicicleta Abdominal",
        series: 3,
        reps: "30",
        restTime: "45s",
        muscleGroup: "Abdômen",
        description: "Exercício dinâmico que integra reto abdominal e oblíquos.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crunches-23435-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se com as mãos atrás da cabeça e pernas elevadas a 45 graus.",
          "Leve o cotovelo direito ao joelho esquerdo enquanto estende a perna direita.",
          "Alterne de forma contínua simulando o movimento de pedalar.",
          "Mantenha o abdômen contraído e o lombar levemente pressionado no chão."
        ],
        proTips: [
          "Rotação deve vir do tronco, não apenas dos cotovelos.",
          "Ritmo moderado com controle — não vire em movimento de balanço."
        ],
        commonErrors: [
          "Puxar o pescoço com as mãos — sobrecarga cervical.",
          "Fazer muito rápido perdendo a ativação dos oblíquos."
        ]
      }
    ]
  }
];

export const ELITE_WORKOUTS: Workout[] = [
  {
    id: "elite-peito-1",
    name: "Peito Superior",
    muscleGroup: "Peito",
    level: "Avançado",
    duration: "65 min",
    carga: "Alta",
    description: "Protocolo de isolamento e sobrecarga máxima na cabeça clavicular do peitoral.",
    planRequired: "Elite",
    authorUid: "system",
    exercises: [
      {
        id: "ex-21",
        name: "Supino Inclinado com Barra (Carga Máxima)",
        series: 5,
        reps: "5-6",
        restTime: "150s",
        muscleGroup: "Peito",
        description: "Principal exercício de força para o peitoral superior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-incline-bench-press-23437-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838387/pexels-photo-3838387.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajuste o banco a 30 graus — ângulo ideal para o peitoral superior.",
          "Segure a barra com pegada levemente mais larga que os ombros.",
          "Desça controladamente até a barra tocar a parte alta do peito.",
          "Empurre explosivamente contraindo o peitoral superior durante toda a subida."
        ],
        proTips: [
          "Use sempre um spotter com cargas máximas.",
          "30 graus é o ângulo ideal — acima disso passa demais para os ombros."
        ],
        commonErrors: [
          "Inclinar o banco acima de 45°, comprometendo o foco no peitoral superior.",
          "Descer a barra no pescoço em vez da clavícula."
        ]
      },
      {
        id: "ex-elite-p1-2",
        name: "Supino Inclinado com Halteres",
        series: 4,
        reps: "8-10",
        restTime: "120s",
        muscleGroup: "Peito",
        description: "Maior amplitude de movimento que a barra para máximo alongamento do peitoral superior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-chest-press-with-dumbbells-in-a-gym-23422-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838389/pexels-photo-3838389.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite no banco inclinado a 30-35 graus com os halteres nos ombros.",
          "Empurre os halteres convergindo levemente ao centro no topo.",
          "Desça além da linha do banco para aproveitar a amplitude máxima.",
          "Suba de forma controlada sem travar os cotovelos."
        ],
        proTips: [
          "Halteres permitem descer mais que a barra — explore essa amplitude.",
          "Foque em sentir o peitoral superior esticar a cada descida."
        ],
        commonErrors: [
          "Bater os halteres no topo em vez de aproximá-los com controle.",
          "Usar carga excessiva que reduz a amplitude do movimento."
        ]
      },
      {
        id: "ex-elite-p1-3",
        name: "Crucifixo Inclinado com Cabos (Polias Baixas)",
        series: 4,
        reps: "10-12",
        restTime: "75s",
        muscleGroup: "Peito",
        description: "Tensão constante no peitoral superior em todo o arco — superior ao halter.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-chest-flys-23443-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838391/pexels-photo-3838391.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajuste as polias na posição baixa e posicione o banco inclinado entre elas.",
          "Segure os cabos com os braços levemente abertos e cotovelos semiflexionados.",
          "Eleve os cabos em arco convergindo as mãos acima do peito.",
          "Desça lentamente em 3 segundos sentindo o alongamento máximo."
        ],
        proTips: [
          "Use cadência 2-1-3 para maximizar o tempo sob tensão no peitoral superior.",
          "No pico, faça contração isométrica de 2 segundos antes de descer."
        ],
        commonErrors: [
          "Dobrar demais os cotovelos, convertendo o movimento em supino.",
          "Usar impulso para elevar os cabos em vez de contrair o peito."
        ]
      },
      {
        id: "ex-elite-p1-4",
        name: "Flexão com Pés Elevados (Drop-set)",
        series: 3,
        reps: "12+12",
        restTime: "90s",
        muscleGroup: "Peito",
        description: "Pés elevados inclinam o ângulo e direcionam toda a tensão para o peitoral superior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-push-ups-23444-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie os pés em um banco elevado e as mãos no chão abaixo dos ombros.",
          "Desça o peito em direção ao chão mantendo o core rígido.",
          "Suba explosivamente e repita até completar as reps.",
          "Imediatamente coloque os pés no chão e execute mais 12 reps normais."
        ],
        proTips: [
          "Quanto mais elevados os pés, maior o ângulo e o foco no peitoral superior.",
          "Sem descanso entre as variações — é um drop-set."
        ],
        commonErrors: [
          "Deixar o quadril subir formando um triângulo com o corpo.",
          "Não ir até a amplitude total na descida."
        ]
      }
    ]
  },
  {
    id: "elite-peito-2",
    name: "Centro do Peito",
    muscleGroup: "Peito",
    level: "Avançado",
    duration: "65 min",
    carga: "Alta",
    description: "Protocolo de máxima força e adução horizontal para o peitoral médio.",
    planRequired: "Elite",
    authorUid: "system",
    exercises: [
      {
        id: "ex-elite-p2-1",
        name: "Supino Reto com Barra (Carga Máxima)",
        series: 5,
        reps: "5",
        restTime: "180s",
        muscleGroup: "Peito",
        description: "O principal exercício de força bruta para o centro do peitoral.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-heavy-bench-press-23440-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838383/pexels-photo-3838383.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se no banco plano com os olhos abaixo da barra.",
          "Segure a barra um pouco mais larga que os ombros e retire do suporte.",
          "Desça de forma controlada até tocar levemente o centro do peito.",
          "Empurre explosivamente de volta à posição inicial."
        ],
        proTips: [
          "Use sempre um spotter com cargas máximas — segurança em primeiro lugar.",
          "Contraia os glúteos e mantenha os pés firmes no chão para criar uma base sólida."
        ],
        commonErrors: [
          "Bater a barra no peito para usar o rebote como impulso.",
          "Retirar os pés do chão durante a execução."
        ]
      },
      {
        id: "ex-elite-p2-2",
        name: "Supino Reto com Halteres (Pausa 2s)",
        series: 4,
        reps: "8-10",
        restTime: "120s",
        muscleGroup: "Peito",
        description: "A pausa elimina o rebote e força o recrutamento puro do peitoral médio.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-chest-press-with-dumbbells-in-a-gym-23422-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838389/pexels-photo-3838389.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite-se no banco plano com os halteres na altura do peito.",
          "Desça os halteres controladamente até sentir o alongamento completo.",
          "Segure na posição mais baixa por 2 segundos sem relaxar o peito.",
          "Empurre explosivamente de volta ao topo sem bater os halteres."
        ],
        proTips: [
          "A pausa de 2s aumenta significativamente a ativação das fibras do peitoral médio.",
          "Use carga 20% menor que o usual para compensar a dificuldade da pausa."
        ],
        commonErrors: [
          "Relaxar o peito durante a pausa, perdendo a tensão muscular.",
          "Subir os halteres sem o impulso muscular — a pausa deve ser total."
        ]
      },
      {
        id: "ex-elite-p2-3",
        name: "Cross Over (Polias na Altura do Peito)",
        series: 4,
        reps: "12",
        restTime: "75s",
        muscleGroup: "Peito",
        description: "Adução horizontal com tensão constante — foco total no centro do peitoral.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-cable-crossover-23438-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838390/pexels-photo-3838390.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajuste as polias na altura do peito e segure os cabos.",
          "Dê um passo à frente com o tronco levemente inclinado.",
          "Traga os cabos em arco até o centro cruzando as mãos levemente.",
          "Retorne lentamente em 3 segundos sentindo o alongamento completo."
        ],
        proTips: [
          "Cruzar as mãos no pico ativa as fibras medianas do peitoral ao máximo.",
          "Polias na altura do peito = foco no centro; abaixo = inferior; acima = superior."
        ],
        commonErrors: [
          "Dobrar os cotovelos, transformando o movimento em supino.",
          "Não manter tensão no retorno, perdendo a fase excêntrica."
        ]
      },
      {
        id: "ex-elite-p2-4",
        name: "Crucifixo Reto com Halteres (Cadência Lenta)",
        series: 3,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Peito",
        description: "Cadência 4-1-2 para tempo sob tensão máximo no peitoral médio.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-performing-dumbbell-chest-flys-on-a-bench-23424-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3839179/pexels-photo-3839179.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite no banco plano com os halteres acima do peito, palmas voltadas entre si.",
          "Abra os braços lentamente em 4 segundos até sentir o alongamento máximo.",
          "Segure na posição mais aberta por 1 segundo.",
          "Feche os braços em arco em 2 segundos contraindo o centro do peito."
        ],
        proTips: [
          "Use cargas leves — o objetivo é tempo sob tensão, não força.",
          "Mantenha os cotovelos levemente flexionados durante todo o movimento."
        ],
        commonErrors: [
          "Usar carga excessiva que força o abandono da cadência lenta.",
          "Descer os halteres além da linha dos ombros, sobrecarregando as articulações."
        ]
      }
    ]
  },
  {
    id: "elite-peito-3",
    name: "Inferior do Peito",
    muscleGroup: "Peito",
    level: "Avançado",
    duration: "70 min",
    carga: "Alta",
    description: "Protocolo com movimentos declinados e de adução para esculpir o peitoral inferior.",
    planRequired: "Elite",
    authorUid: "system",
    exercises: [
      {
        id: "ex-elite-p3-1",
        name: "Supino Declinado com Barra (Carga Máxima)",
        series: 5,
        reps: "6-8",
        restTime: "150s",
        muscleGroup: "Peito",
        description: "O movimento de maior carga absoluta para o peitoral inferior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-decline-bench-press-23442-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838385/pexels-photo-3838385.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajuste o banco em declive de 20-30 graus e prenda os pés com segurança.",
          "Segure a barra com pegada ligeiramente mais larga que os ombros.",
          "Desça a barra à parte inferior do peitoral de forma controlada.",
          "Empurre explosivamente de volta ao topo contraindo o peitoral inferior."
        ],
        proTips: [
          "O declive permite usar 10-15% mais carga que o supino plano.",
          "Certifique-se de que os pés estão bem presos antes de iniciar."
        ],
        commonErrors: [
          "Inclinar o banco demais (acima de 40°), comprometendo a segurança.",
          "Não descer a barra até o peitoral inferior — descer muito alto."
        ]
      },
      {
        id: "ex-elite-p3-2",
        name: "Supino Declinado com Halteres",
        series: 4,
        reps: "8-10",
        restTime: "120s",
        muscleGroup: "Peito",
        description: "Amplitude superior à barra para maior ativação das fibras inferiores.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-chest-press-with-dumbbells-in-a-gym-23422-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838389/pexels-photo-3838389.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Deite no banco declinado com os halteres na altura do peitoral inferior.",
          "Empurre os halteres para cima convergindo levemente ao centro.",
          "Desça além da linha do banco para explorar a amplitude máxima.",
          "Suba controlando o movimento sem travar os cotovelos."
        ],
        proTips: [
          "Halteres permitem maior amplitude — explore esse diferencial.",
          "Mantenha os cotovelos a 45 graus em relação ao tronco."
        ],
        commonErrors: [
          "Bater os halteres no topo em vez de aproximá-los com controle.",
          "Usar carga excessiva que reduz a amplitude do movimento."
        ]
      },
      {
        id: "ex-elite-p3-3",
        name: "Mergulho entre Bancos (Dips)",
        series: 4,
        reps: "10-12",
        restTime: "90s",
        muscleGroup: "Peito",
        description: "O exercício com o peso corporal mais eficaz para o peitoral inferior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-push-ups-23444-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie as mãos em duas barras paralelas com o corpo levemente inclinado à frente.",
          "Desça flexionando os cotovelos até sentir forte alongamento no peitoral inferior.",
          "Mantenha o tronco inclinado a 15-20 graus durante todo o movimento.",
          "Empurre de volta à posição inicial sem travar os cotovelos no topo."
        ],
        proTips: [
          "Inclinação do tronco à frente = mais peitoral; tronco reto = mais tríceps.",
          "Use cinto de lastro quando o peso corporal se tornar insuficiente."
        ],
        commonErrors: [
          "Manter o tronco muito reto, transferindo o trabalho para o tríceps.",
          "Não descer o suficiente, reduzindo o alongamento do peitoral inferior."
        ]
      },
      {
        id: "ex-elite-p3-4",
        name: "Cross Over de Cima para Baixo (Drop-set)",
        series: 3,
        reps: "12+12",
        restTime: "90s",
        muscleGroup: "Peito",
        description: "Polias altas direcionam a adução exatamente para o peitoral inferior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-cable-crossover-23438-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3838390/pexels-photo-3838390.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajuste as polias na posição alta e segure os cabos com os braços abertos.",
          "Puxe os cabos de cima para baixo em arco convergindo as mãos abaixo do quadril.",
          "Contraia o peitoral inferior no pico e retorne controladamente.",
          "Reduza a carga imediatamente e execute mais 12 reps sem descanso."
        ],
        proTips: [
          "Quanto mais baixo o cruzamento das mãos, maior o foco no peitoral inferior.",
          "Mantenha o tronco levemente inclinado à frente para melhor ângulo."
        ],
        commonErrors: [
          "Cruzar as mãos na altura do peito em vez de abaixo do quadril.",
          "Usar impulso dos ombros em vez de contrair o peitoral inferior."
        ]
      }
    ]
  },
  {
    id: "elite-costas-1",
    name: "Largura das Costas",
    muscleGroup: "Costas",
    level: "Avançado",
    duration: "70 min",
    carga: "Alta",
    description: "Protocolo de hipertrofia e força para costas de atleta.",
    planRequired: "Elite",
    authorUid: "system",
    exercises: [
      {
        id: "ex-elite-c1-1",
        name: "Levantamento Terra Romeno",
        series: 4,
        reps: "6-8",
        restTime: "150s",
        muscleGroup: "Costas",
        description: "Ativa toda a cadeia posterior com carga máxima.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-deadlift-exercise-23441-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162587/pexels-photo-4162587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé com a barra na frente das coxas, pegada pronada na largura dos ombros.",
          "Empurre o quadril para trás mantendo a coluna neutra e os joelhos levemente flexionados.",
          "Desça a barra próxima às pernas até sentir forte tensão nos isquiotibiais.",
          "Contraia os glúteos e estenda o quadril para retornar à posição inicial."
        ],
        proTips: [
          "Foque no empurrão do quadril para trás — não em dobrar as costas.",
          "A barra deve roçar as coxas durante todo o movimento para manter a alavanca."
        ],
        commonErrors: [
          "Arredondar a lombar, especialmente no ponto mais baixo do movimento.",
          "Dobrar demais os joelhos, transformando em um levantamento terra convencional."
        ]
      },
      {
        id: "ex-elite-c1-2",
        name: "Remada Curvada com Barra (Pegada Pronada)",
        series: 4,
        reps: "6-8",
        restTime: "120s",
        muscleGroup: "Costas",
        description: "O exercício de massa para as costas — ativa latíssimo, romboides e trapézio.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Incline o tronco a 45 graus com a barra suspensa, joelhos levemente flexionados.",
          "Mantenha a coluna neutra e o core rígido durante todo o movimento.",
          "Puxe a barra em direção ao abdômen inferior retraindo as escápulas.",
          "Desça controladamente até os braços ficarem totalmente estendidos."
        ],
        proTips: [
          "Lidere o movimento com os cotovelos, não com as mãos.",
          "Expire com força ao puxar para estabilizar o core."
        ],
        commonErrors: [
          "Usar o balanço do tronco para ajudar a levantar a carga.",
          "Não retrair as escápulas no pico, perdendo a ativação do meio das costas."
        ]
      },
      {
        id: "ex-elite-c1-3",
        name: "Puxada Pronada com Carga Alta",
        series: 4,
        reps: "6-8",
        restTime: "120s",
        muscleGroup: "Costas",
        description: "Latíssimo em sobrecarga máxima para largura de costas.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lat-pulldown-exercise-in-gym-23427-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164761/pexels-photo-4164761.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajuste o joelheiro da máquina firme e segure a barra com pegada pronada larga.",
          "Incline levemente o tronco para trás e inicie o movimento deprimindo as escápulas.",
          "Puxe a barra até a linha do queixo contraindo ao máximo o latíssimo.",
          "Retorne lentamente (3s) para aproveitar a fase excêntrica."
        ],
        proTips: [
          "Imagine que está tentando quebrar a barra ao meio — isso ativa mais o latíssimo.",
          "A fase excêntrica (retorno) é tão importante quanto a concêntrica."
        ],
        commonErrors: [
          "Usar impulso do corpo para puxar a barra.",
          "Não descer o suficiente na fase excêntrica, perdendo o alongamento."
        ]
      },
      {
        id: "ex-elite-c1-4",
        name: "Remada Unilateral com Halter (Carga Máxima)",
        series: 4,
        reps: "8 cada lado",
        restTime: "90s",
        muscleGroup: "Costas",
        description: "Correção de assimetrias e sobrecarga unilateral superior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie um joelho e a mão no banco com o tronco paralelo ao chão.",
          "Segure o halter com o braço estendido diretamente abaixo do ombro.",
          "Puxe o halter em direção ao quadril, mantendo o cotovelo junto ao corpo.",
          "Desça controladamente até a extensão completa do braço."
        ],
        proTips: [
          "Use carga que permita uma leve rotação do tronco para maior amplitude.",
          "Segure no pico por 1 segundo para máxima contração do latíssimo."
        ],
        commonErrors: [
          "Rodar excessivamente o tronco, usando impulso em vez de força.",
          "Puxar em direção ao ombro em vez do quadril, mudando o músculo-alvo."
        ]
      }
    ]
  },
  {
    id: "elite-costas-2",
    name: "Espessura das Costas",
    muscleGroup: "Costas",
    level: "Avançado",
    duration: "70 min",
    carga: "Alta",
    description: "Remadas pesadas para romboides, trapézio médio e espessura total das costas.",
    planRequired: "Elite",
    authorUid: "system",
    exercises: [
      {
        id: "ex-elite-c2-1",
        name: "Remada Curvada com Barra (Carga Máxima)",
        series: 5,
        reps: "5-6",
        restTime: "150s",
        muscleGroup: "Costas",
        description: "O exercício de espessura mais poderoso — carga máxima com técnica.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Incline o tronco a 45° com a barra suspensa, joelhos levemente flexionados.",
          "Segure a barra com pegada pronada ligeiramente mais larga que os ombros.",
          "Puxe a barra em direção ao abdômen inferior retraindo completamente as escápulas.",
          "Desça controladamente à extensão total dos braços."
        ],
        proTips: [
          "Use 85-90% do 1RM para máxima ativação das fibras musculares.",
          "Inspire antes de puxar e expire com força — aumenta a estabilidade."
        ],
        commonErrors: [
          "Usar o balanço do tronco para compensar a carga.",
          "Não retrair as escápulas no pico, perdendo ativação dos romboides."
        ]
      },
      {
        id: "ex-elite-c2-2",
        name: "Remada T-Bar",
        series: 4,
        reps: "8",
        restTime: "120s",
        muscleGroup: "Costas",
        description: "Ângulo único que ativa profundamente o meio das costas.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione-se sobre a barra T com o peito no apoio e as mãos nos puxadores.",
          "Puxe os puxadores em direção ao peito retraindo as escápulas.",
          "Segure no pico por 1 segundo sentindo a contração do meio das costas.",
          "Desça lentamente à extensão completa."
        ],
        proTips: [
          "O apoio no peito elimina o balanço — foco total nas costas.",
          "Pegada neutra (paralela) ativa mais os romboides."
        ],
        commonErrors: [
          "Não apoiar o peito corretamente, voltando a usar o balanço.",
          "Puxar com os braços em vez de liderar com os cotovelos."
        ]
      },
      {
        id: "ex-elite-c2-3",
        name: "Remada Pendlay",
        series: 4,
        reps: "6",
        restTime: "120s",
        muscleGroup: "Costas",
        description: "Variação explosiva da remada — cada rep começa do chão para eliminar impulso.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione-se com o tronco paralelo ao chão e a barra no chão.",
          "Puxe a barra explosivamente em direção ao abdômen inferior.",
          "Retorne a barra ao chão completamente antes de cada repetição.",
          "Tronco permanece paralelo ao chão durante todas as reps."
        ],
        proTips: [
          "Cada rep começa do zero — não há impulso acumulado.",
          "Explosividade na subida; controle na descida."
        ],
        commonErrors: [
          "Não retornar a barra completamente ao chão entre as reps.",
          "Levantar o tronco para compensar a carga."
        ]
      },
      {
        id: "ex-elite-c2-4",
        name: "Remada Unilateral com Halter (Pausa 2s)",
        series: 3,
        reps: "10 cada lado",
        restTime: "90s",
        muscleGroup: "Costas",
        description: "Pausa no pico elimina impulso e maximiza a ativação dos romboides.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-seated-cable-row-in-gym-23426-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie joelho e mão no banco com tronco paralelo ao chão.",
          "Puxe o halter em direção ao quadril contraindo completamente a escápula.",
          "Segure a posição por 2 segundos completos.",
          "Desça lentamente à extensão completa."
        ],
        proTips: [
          "A pausa de 2s aumenta drasticamente a ativação — use 20% menos carga.",
          "Complete todas as reps de um lado antes de trocar."
        ],
        commonErrors: [
          "Relaxar a escápula durante a pausa, perdendo a contração.",
          "Rotar o tronco para usar impulso."
        ]
      }
    ]
  },
  {
    id: "elite-costas-3",
    name: "Lombar",
    muscleGroup: "Costas",
    level: "Avançado",
    duration: "60 min",
    carga: "Alta",
    description: "Eretos da espinha e cadeia posterior — a base de toda a força do atleta.",
    planRequired: "Elite",
    authorUid: "system",
    exercises: [
      {
        id: "ex-elite-c3-1",
        name: "Levantamento Terra Convencional",
        series: 5,
        reps: "5",
        restTime: "180s",
        muscleGroup: "Costas",
        description: "O exercício mais completo para fortalecer a lombar e toda a cadeia posterior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-deadlift-exercise-23441-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162587/pexels-photo-4162587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione-se com os pés na largura dos quadris, barra sobre o meio do pé.",
          "Agache e segure a barra com as mãos logo fora das pernas, coluna neutra.",
          "Empurre o chão com os pés levantando a barra próxima ao corpo.",
          "Estenda quadris e joelhos simultaneamente até ficar completamente ereto."
        ],
        proTips: [
          "Execute a manobra de Valsalva (segurar o ar) antes de cada rep para proteger a lombar.",
          "A barra deve raspar as pernas durante toda a subida."
        ],
        commonErrors: [
          "Arredondar a lombar — o erro mais perigoso do levantamento terra.",
          "Deixar a barra se afastar do corpo durante a subida."
        ]
      },
      {
        id: "ex-elite-c3-2",
        name: "Hiperextensão com Anilha",
        series: 4,
        reps: "10-12",
        restTime: "90s",
        muscleGroup: "Costas",
        description: "Isolamento dos eretos da espinha com carga progressiva.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-deadlift-exercise-23441-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162587/pexels-photo-4162587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione-se no banco de hiperextensão com o quadril no apoio.",
          "Segure uma anilha contra o peito ou atrás da cabeça.",
          "Flexione o tronco para baixo mantendo a coluna neutra.",
          "Estenda o tronco até a posição horizontal — não hiperextenda."
        ],
        proTips: [
          "Não vá além do paralelo — hiperextensão sobrecarrega os discos.",
          "Use o glúteo para estender — não apenas a lombar."
        ],
        commonErrors: [
          "Hiperextender a lombar no topo, comprimindo os discos.",
          "Usar impulso em vez de controlar o movimento."
        ]
      },
      {
        id: "ex-elite-c3-3",
        name: "Good Morning com Barra",
        series: 3,
        reps: "8-10",
        restTime: "120s",
        muscleGroup: "Costas",
        description: "Movimento avançado que une eretos da espinha e isquiotibiais.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-deadlift-exercise-23441-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162587/pexels-photo-4162587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione a barra nos trapézios (como no agachamento low bar).",
          "Com joelhos levemente flexionados, incline o tronco à frente.",
          "Desça até o tronco ficar quase paralelo ao chão mantendo a coluna neutra.",
          "Retorne contraindo os glúteos e eretos da espinha."
        ],
        proTips: [
          "Comece com carga muito leve para dominar o padrão de movimento.",
          "É essencialmente um stiff com barra nos ombros."
        ],
        commonErrors: [
          "Arredondar a lombar — pode causar lesão grave com carga.",
          "Usar carga excessiva antes de dominar a técnica."
        ]
      },
      {
        id: "ex-elite-c3-4",
        name: "Levantamento Terra Romeno",
        series: 4,
        reps: "8",
        restTime: "120s",
        muscleGroup: "Costas",
        description: "Ênfase nos isquiotibiais e lombar — amplitude maior que o convencional.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-deadlift-exercise-23441-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162587/pexels-photo-4162587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Comece em pé com a barra na frente das coxas.",
          "Empurre o quadril para trás mantendo a barra próxima às pernas.",
          "Desça até sentir forte tensão nos isquiotibiais sem arredondar.",
          "Empurre o quadril para frente para retornar."
        ],
        proTips: [
          "A barra deve roçar as pernas durante todo o movimento.",
          "Quanto mais se inclinar com coluna neutra, maior o estímulo na lombar."
        ],
        commonErrors: [
          "Arredondar a lombar na fase mais baixa.",
          "Dobrar demais os joelhos, convertendo em levantamento terra convencional."
        ]
      }
    ]
  },
  {
    id: "elite-pernas-1",
    name: "Quadríceps",
    muscleGroup: "Pernas",
    level: "Avançado",
    duration: "80 min",
    carga: "Alta",
    description: "Protocolo de força e hipertrofia para membros inferiores de atleta.",
    planRequired: "Elite",
    authorUid: "system",
    exercises: [
      {
        id: "ex-elite-l1-1",
        name: "Agachamento com Barra (Carga Máxima)",
        series: 5,
        reps: "5",
        restTime: "180s",
        muscleGroup: "Pernas",
        description: "O rei dos exercícios — máxima ativação do sistema nervoso central.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-23425-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162438/pexels-photo-4162438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione a barra na posição low bar (abaixo dos espinhos da escápula).",
          "Pés na largura dos ombros com os dedos levemente apontados para fora.",
          "Desça de forma controlada até as coxas ficarem abaixo do paralelo.",
          "Suba explosivamente empurrando o chão com toda a força disponível."
        ],
        proTips: [
          "Respire fundo antes de descer e execute a manobra de Valsalva para estabilizar.",
          "Mantenha os joelhos apontando na direção dos dedos dos pés durante toda a execução."
        ],
        commonErrors: [
          "Fazer o 'wink' pélvico (retroversão do quadril na fase mais baixa).",
          "Subir com o quadril antes do tronco, sobrecarregando a lombar."
        ]
      },
      {
        id: "ex-elite-l1-2",
        name: "Leg Press 45 (Alta Carga)",
        series: 4,
        reps: "8-10",
        restTime: "120s",
        muscleGroup: "Pernas",
        description: "Volume complementar ao agachamento com foco no quadríceps.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-leg-press-in-gym-23429-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837781/pexels-photo-3837781.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione os pés na parte central da plataforma na largura dos ombros.",
          "Empurre até quase a extensão completa sem travar os joelhos.",
          "Desça lentamente (4s) até as coxas formarem 90 graus com o tronco.",
          "Empurre explosivamente sem perder o contato das costas no assento."
        ],
        proTips: [
          "Após o agachamento, use 15-20% menos carga para manter a qualidade.",
          "Posição dos pés mais alta ativa glúteos; mais baixa, quadríceps."
        ],
        commonErrors: [
          "Travar os joelhos no topo, sobrecarregando a articulação.",
          "Descolar o quadril do assento na fase excêntrica."
        ]
      },
      {
        id: "ex-elite-l1-3",
        name: "Stiff com Halteres",
        series: 4,
        reps: "10-12",
        restTime: "90s",
        muscleGroup: "Pernas",
        description: "Isquiotibiais e glúteos em sobrecarga com amplitude aumentada.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-deadlift-exercise-23441-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162587/pexels-photo-4162587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé sobre uma plataforma elevada com os halteres na frente das coxas.",
          "Incline o tronco mantendo pernas quase retas e coluna neutra.",
          "Desça os halteres além da plataforma para máximo alongamento.",
          "Contraia glúteos e isquiotibiais para retornar à posição inicial."
        ],
        proTips: [
          "A plataforma elevada aumenta a amplitude e o estímulo nos isquiotibiais.",
          "Controle a descida em 3-4 segundos para maximizar o alongamento."
        ],
        commonErrors: [
          "Arredondar a lombar na fase mais baixa do movimento.",
          "Dobrar demais os joelhos, transformando em levantamento terra romeno."
        ]
      },
      {
        id: "ex-elite-l1-4",
        name: "Agachamento Búlgaro com Halteres",
        series: 3,
        reps: "10 cada lado",
        restTime: "90s",
        muscleGroup: "Pernas",
        description: "Força unilateral para corrigir assimetrias e maximizar a ativação do glúteo.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-bulgarian-split-squat-23439-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162454/pexels-photo-4162454.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie o pé traseiro em um banco e segure halteres nas laterais do corpo.",
          "Mantenha o tronco ereto e o core ativado durante todo o movimento.",
          "Desça até a coxa dianteira ficar paralela ao chão.",
          "Empurre com o calcanhar da frente para subir de forma explosiva."
        ],
        proTips: [
          "Use halteres pesados — atletas de elite chegam a usar 50kg+ por lado.",
          "Complete todas as reps de um lado antes de trocar para manter a fadiga específica."
        ],
        commonErrors: [
          "Posicionar o pé da frente muito perto do banco.",
          "Deixar o joelho colapsar para dentro na fase concêntrica."
        ]
      }
    ]
  },
  {
    id: "elite-pernas-2",
    name: "Posterior e Glúteos",
    muscleGroup: "Pernas",
    level: "Avançado",
    duration: "75 min",
    carga: "Alta",
    description: "Isquiotibiais e glúteos com sobrecarga máxima — cadeia posterior de atleta.",
    planRequired: "Elite",
    authorUid: "system",
    exercises: [
      {
        id: "ex-elite-l2-1",
        name: "Levantamento Terra Romeno (Carga Máxima)",
        series: 5,
        reps: "6",
        restTime: "150s",
        muscleGroup: "Pernas",
        description: "Máxima carga nos isquiotibiais e glúteos com amplitude total.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-deadlift-exercise-23441-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162587/pexels-photo-4162587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione-se em pé sobre uma plataforma para maior amplitude.",
          "Barra nas coxas, joelhos levemente flexionados e coluna neutra.",
          "Empurre o quadril para trás até sentir o máximo de tensão nos isquiotibiais.",
          "Contraia glúteos e isquiotibiais para retornar explosivamente."
        ],
        proTips: [
          "A plataforma elevada aumenta a amplitude em 10-15 cm.",
          "A barra deve roçar as pernas durante todo o movimento."
        ],
        commonErrors: [
          "Arredondar a lombar especialmente com cargas próximas do máximo.",
          "Dobrar demais os joelhos, convertendo em levantamento terra convencional."
        ]
      },
      {
        id: "ex-elite-l2-2",
        name: "Hip Thrust com Barra (Carga Máxima)",
        series: 5,
        reps: "8",
        restTime: "120s",
        muscleGroup: "Pernas",
        description: "Glúteos em sobrecarga absoluta — o exercício mais eficaz para a musculatura.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-23425-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162438/pexels-photo-4162438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie as escápulas no banco com a barra sobre o quadril (use pad).",
          "Pés na largura dos quadris e joelhos a 90 graus no topo.",
          "Desça o quadril ao chão e empurre explosivamente para cima.",
          "Contraia os glúteos ao máximo no topo por 2 segundos."
        ],
        proTips: [
          "Atletas de elite chegam a usar 200kg+ nesse exercício.",
          "No topo: tronco paralelo ao chão, joelhos a 90 graus."
        ],
        commonErrors: [
          "Arquear a lombar no topo em vez de contrair os glúteos.",
          "Não completar a extensão total do quadril no pico."
        ]
      },
      {
        id: "ex-elite-l2-3",
        name: "Cadeira Flexora (Drop-set)",
        series: 4,
        reps: "10+10",
        restTime: "90s",
        muscleGroup: "Pernas",
        description: "Drop-set para exaustão total dos isquiotibiais.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-leg-extensions-23430-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837757/pexels-photo-3837757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Execute 10 reps na carga normal com cadência 2-1-3.",
          "Reduza a carga em 30% imediatamente sem descanso.",
          "Execute mais 10 reps até a falha concêntrica.",
          "Pressione o quadril contra o banco durante todas as reps."
        ],
        proTips: [
          "Tenha parceiro para trocar o pino rapidamente.",
          "Na última carga, vá até a falha total para recrutamento máximo."
        ],
        commonErrors: [
          "Descansar entre as reduções, quebrando o drop-set.",
          "Levantar o quadril para compensar a fadiga."
        ]
      },
      {
        id: "ex-elite-l2-4",
        name: "Passada com Halteres (Lunge Avançado)",
        series: 3,
        reps: "12 cada lado",
        restTime: "90s",
        muscleGroup: "Pernas",
        description: "Glúteos e isquiotibiais em movimento unilateral funcional.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-bulgarian-split-squat-23439-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162454/pexels-photo-4162454.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Fique em pé com halteres pesados nas laterais do corpo.",
          "Dê um passo longo à frente e desça o joelho traseiro ao chão.",
          "Empurre com o calcanhar da frente para retornar à posição inicial.",
          "Alterne as pernas a cada repetição."
        ],
        proTips: [
          "Passo mais longo = mais glúteo. Passo mais curto = mais quadríceps.",
          "Olhe para frente e mantenha o tronco ereto durante todo o movimento."
        ],
        commonErrors: [
          "Deixar o joelho da frente ultrapassar os dedos dos pés.",
          "Dar passos muito curtos, sobrecarregando o joelho."
        ]
      }
    ]
  },
  {
    id: "elite-pernas-3",
    name: "Panturrilha",
    muscleGroup: "Pernas",
    level: "Avançado",
    duration: "40 min",
    carga: "Alta",
    description: "Protocolo específico para panturrilha — o músculo mais resistente do corpo.",
    planRequired: "Elite",
    authorUid: "system",
    exercises: [
      {
        id: "ex-elite-l3-1",
        name: "Gêmeos em Pé (Carga Alta)",
        series: 5,
        reps: "12",
        restTime: "60s",
        muscleGroup: "Pernas",
        description: "Gastrocnêmio com joelhos estendidos — a barriga da panturrilha.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-23425-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162438/pexels-photo-4162438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione os dedos em uma plataforma elevada com os calcanhares suspensos.",
          "Desça os calcanhares ao máximo sentindo o alongamento completo.",
          "Suba na ponta dos pés ao máximo contraindo a panturrilha.",
          "Segure no topo por 2 segundos antes de descer."
        ],
        proTips: [
          "Amplitude total é essencial — suba e desça completamente em cada rep.",
          "A panturrilha precisa de mais reps e frequência que outros músculos."
        ],
        commonErrors: [
          "Usar amplitude parcial — o maior erro no treino de panturrilha.",
          "Subir rápido demais sem a contração máxima no topo."
        ]
      },
      {
        id: "ex-elite-l3-2",
        name: "Gêmeos Sentado (Sóleo)",
        series: 4,
        reps: "15",
        restTime: "60s",
        muscleGroup: "Pernas",
        description: "Joelhos flexionados desativam o gastrocnêmio — foco no sóleo.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-23425-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162438/pexels-photo-4162438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se na máquina de panturrilha sentado com os joelhos a 90 graus.",
          "Posicione os dedos na borda da plataforma e o apoio sobre as coxas.",
          "Desça os calcanhares ao máximo e suba na ponta dos pés ao máximo.",
          "Segure no topo por 2 segundos em cada repetição."
        ],
        proTips: [
          "O sóleo tem mais fibras de contração lenta — responde bem a mais reps.",
          "Use carga moderada com amplitude total."
        ],
        commonErrors: [
          "Não completar a amplitude em ambos os sentidos.",
          "Usar a trava do joelho como apoio em vez de contrair a panturrilha."
        ]
      },
      {
        id: "ex-elite-l3-3",
        name: "Gêmeos Unilateral com Halter",
        series: 3,
        reps: "15 cada lado",
        restTime: "45s",
        muscleGroup: "Pernas",
        description: "Corrige assimetrias e aumenta a amplitude com peso unilateral.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-squats-23425-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162438/pexels-photo-4162438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Apoie um pé em uma plataforma elevada e segure um halter do mesmo lado.",
          "Use a outra mão para equilíbrio apoiada em uma superfície estável.",
          "Desça o calcanhar ao máximo e suba na ponta do pé ao máximo.",
          "Complete todas as reps de um lado antes de trocar."
        ],
        proTips: [
          "Unilateral revela e corrige diferenças de força entre os lados.",
          "Segure no topo por 2 segundos — isométrico aumenta a ativação."
        ],
        commonErrors: [
          "Usar o outro pé para ajudar no movimento.",
          "Não executar a amplitude completa por falta de equilíbrio."
        ]
      },
      {
        id: "ex-elite-l3-4",
        name: "Gêmeos no Leg Press",
        series: 3,
        reps: "20",
        restTime: "45s",
        muscleGroup: "Pernas",
        description: "Carga muito superior ao peso corporal — amplitude máxima garantida.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-leg-press-in-gym-23429-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837781/pexels-photo-3837781.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Coloque apenas os dedos dos pés na parte baixa da plataforma do leg press.",
          "Pernas quase totalmente estendidas e joelhos sem travar.",
          "Estenda completamente o tornozelo subindo na ponta dos pés.",
          "Desça os calcanhares até o máximo de alongamento."
        ],
        proTips: [
          "Permite usar cargas muito maiores que o peso corporal.",
          "Reps lentas (3s subida, 2s pausa, 3s descida) para máximo estímulo."
        ],
        commonErrors: [
          "Usar amplitude parcial por excesso de carga.",
          "Travar os joelhos durante o exercício."
        ]
      }
    ]
  },
  {
    id: "elite-ombros-1",
    name: "Deltoide Anterior",
    muscleGroup: "Ombros",
    level: "Avançado",
    duration: "65 min",
    carga: "Alta",
    description: "Protocolo para desenvolvimento completo das três cabeças do deltoide.",
    planRequired: "Elite",
    authorUid: "system",
    exercises: [
      {
        id: "ex-elite-o1-1",
        name: "Desenvolvimento Militar com Barra",
        series: 5,
        reps: "5-6",
        restTime: "150s",
        muscleGroup: "Ombros",
        description: "O exercício básico de força para ombros — carga máxima no deltoide anterior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-dumbbell-shoulder-press-23431-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837793/pexels-photo-3837793.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se em banco sem encosto com a barra na altura do peito, pegada pronada.",
          "Mantenha o core fortemente contraído e a lombar neutra.",
          "Empurre a barra para cima até quase a extensão total dos braços.",
          "Desça controladamente até a barra atingir a altura do queixo."
        ],
        proTips: [
          "Execute em pé para maior recrutamento do core e mais carga total.",
          "Não trave os cotovelos no topo para manter a tensão nos deltoides."
        ],
        commonErrors: [
          "Arquear a lombar excessivamente para compensar a carga.",
          "Usar impulso das pernas para empurrar a barra."
        ]
      },
      {
        id: "ex-elite-o1-2",
        name: "Elevação Lateral com Cabos (Drop-set)",
        series: 4,
        reps: "12+12",
        restTime: "90s",
        muscleGroup: "Ombros",
        description: "Tensão constante no deltoide medial com duas reduções de carga.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lateral-raises-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837799/pexels-photo-3837799.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Segure o cabo cruzando o corpo (mão direita no cabo esquerdo) para tensão constante.",
          "Eleve o braço até a altura do ombro com leve flexão no cotovelo.",
          "Complete 12 reps, reduza a carga imediatamente e execute mais 12.",
          "Troque de lado e repita o protocolo."
        ],
        proTips: [
          "O cabo cruzado mantém tensão no início do movimento — halteres não têm isso.",
          "Gire o polegar levemente para baixo no pico para maior ativação do medial."
        ],
        commonErrors: [
          "Elevar os braços acima dos ombros, recrutando o trapézio.",
          "Usar impulso do corpo para elevar o cabo."
        ]
      },
      {
        id: "ex-elite-o1-3",
        name: "Elevação Frontal com Anilha",
        series: 3,
        reps: "10-12",
        restTime: "75s",
        muscleGroup: "Ombros",
        description: "Deltoide anterior em isolamento com carga constante e controlada.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-dumbbell-shoulder-press-23431-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837793/pexels-photo-3837793.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Segure a anilha com ambas as mãos na frente do corpo, braços estendidos.",
          "Eleve a anilha até a altura dos ombros mantendo os braços ligeiramente flexionados.",
          "Segure no pico por 1 segundo e desça lentamente em 3 segundos.",
          "Mantenha o core ativo para evitar o balanço do tronco."
        ],
        proTips: [
          "A anilha é superior ao halter por distribuir o peso de forma mais estável.",
          "Não suba acima do nível dos ombros — além disso o trapézio domina o movimento."
        ],
        commonErrors: [
          "Oscilar o tronco para usar impulso na subida.",
          "Descer rápido demais sem aproveitar a fase excêntrica."
        ]
      },
      {
        id: "ex-elite-o1-4",
        name: "Face Pull com Corda",
        series: 4,
        reps: "15",
        restTime: "60s",
        muscleGroup: "Ombros",
        description: "Deltoide posterior e manguito rotador — essencial para saúde do ombro.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-tricep-pushdowns-23434-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164767/pexels-photo-4164767.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajuste o cabo na altura dos olhos e segure a corda com as duas mãos.",
          "Dê um passo para trás criando tensão inicial no cabo.",
          "Puxe a corda em direção ao rosto separando as mãos ao final.",
          "Retorne controladamente à posição inicial mantendo os cotovelos altos."
        ],
        proTips: [
          "Mantenha os cotovelos acima dos punhos durante todo o movimento.",
          "Inclua esse exercício em todo treino de ombros para prevenir lesões."
        ],
        commonErrors: [
          "Deixar os cotovelos caírem abaixo dos ombros durante a execução.",
          "Usar carga alta que compromete a técnica — prefira volume com técnica."
        ]
      }
    ]
  },
  {
    id: "elite-ombros-2",
    name: "Deltoide Medial",
    muscleGroup: "Ombros",
    level: "Avançado",
    duration: "55 min",
    carga: "Alta",
    description: "Protocolo de volume para o deltoide medial — largura e redondeza nos ombros.",
    planRequired: "Elite",
    authorUid: "system",
    exercises: [
      {
        id: "ex-elite-o2-1",
        name: "Elevação Lateral com Cabos (Bilateral)",
        series: 5,
        reps: "12",
        restTime: "75s",
        muscleGroup: "Ombros",
        description: "Tensão constante em todo o arco — superior ao halter para o deltoide medial.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lateral-raises-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837799/pexels-photo-3837799.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Segure os dois cabos cruzados (mão direita no cabo esquerdo e vice-versa).",
          "Eleve os braços para os lados até a altura dos ombros simultaneamente.",
          "Segure no pico por 1 segundo girando levemente o polegar para baixo.",
          "Desça lentamente em 3 segundos."
        ],
        proTips: [
          "Cabos cruzados mantêm tensão no início do movimento — halteres não.",
          "O giro do polegar para baixo ativa ainda mais o deltoide medial."
        ],
        commonErrors: [
          "Elevar acima dos ombros, recrutando o trapézio.",
          "Usar impulso do corpo para elevar os cabos."
        ]
      },
      {
        id: "ex-elite-o2-2",
        name: "Elevação Lateral com Halteres (3 séries gigantes)",
        series: 4,
        reps: "15+15+15",
        restTime: "90s",
        muscleGroup: "Ombros",
        description: "Série gigante: sentado, em pé e inclinado para ativar todo o deltoide medial.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lateral-raises-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837799/pexels-photo-3837799.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Execute 15 reps sentado (ângulo 90°) sem descanso.",
          "Execute 15 reps em pé (ângulo 0°) sem descanso.",
          "Execute 15 reps inclinado (45°) sem descanso.",
          "Descanse entre as séries gigantes completas."
        ],
        proTips: [
          "Use a mesma carga nos 3 ângulos — leve o suficiente para completar os 45 total.",
          "Ângulos diferentes ativam partes ligeiramente distintas do deltoide medial."
        ],
        commonErrors: [
          "Usar carga pesada demais que impossibilita completar a série gigante.",
          "Balançar o tronco para compensar a fadiga."
        ]
      },
      {
        id: "ex-elite-o2-3",
        name: "Desenvolvimento com Halteres (Amplitude Parcial)",
        series: 3,
        reps: "15",
        restTime: "60s",
        muscleGroup: "Ombros",
        description: "Amplitude parcial na metade inferior ativa mais o deltoide medial.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-dumbbell-shoulder-press-23431-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837793/pexels-photo-3837793.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Segure os halteres na altura dos ombros com cotovelos a 90 graus.",
          "Empurre os halteres apenas até a metade do movimento (cotovelos a 135°).",
          "Retorne à posição inicial sem completar a extensão.",
          "Mantenha tensão constante nessa faixa de movimento."
        ],
        proTips: [
          "A faixa de 90° a 135° é onde o deltoide medial tem maior ativação.",
          "Use carga 20% maior que o desenvolvimento completo normal."
        ],
        commonErrors: [
          "Estender demais os braços, perdendo o foco no deltoide medial.",
          "Não manter tensão constante durante as repetições."
        ]
      },
      {
        id: "ex-elite-o2-4",
        name: "Elevação Lateral Isométrica com Cabos",
        series: 3,
        reps: "8 cada lado",
        restTime: "60s",
        muscleGroup: "Ombros",
        description: "Contrações isométricas de 5 segundos para ativar todas as fibras do deltoide medial.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lateral-raises-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837799/pexels-photo-3837799.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Segure o cabo com um braço e eleve até a altura dos ombros.",
          "Segure a posição por 5 segundos completos.",
          "Desça lentamente em 3 segundos.",
          "Complete todas as reps de um lado antes de trocar."
        ],
        proTips: [
          "Contrações isométricas recrutam fibras que reps dinâmicas normais não alcançam.",
          "Use carga 30% menor que o normal para completar o tempo isométrico."
        ],
        commonErrors: [
          "Não manter os 5 segundos completos — reduz o benefício.",
          "Elevar acima dos ombros durante a contração isométrica."
        ]
      }
    ]
  },
  {
    id: "elite-ombros-3",
    name: "Deltoide Posterior",
    muscleGroup: "Ombros",
    level: "Avançado",
    duration: "50 min",
    carga: "Alta",
    description: "Protocolo completo para o deltoide posterior — estética e saúde articular.",
    planRequired: "Elite",
    authorUid: "system",
    exercises: [
      {
        id: "ex-elite-o3-1",
        name: "Crucifixo Inverso com Halteres (Tronco a 90°, Drop-set)",
        series: 4,
        reps: "15+15",
        restTime: "90s",
        muscleGroup: "Ombros",
        description: "Drop-set para exaustão total do deltoide posterior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lateral-raises-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837799/pexels-photo-3837799.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Incline o tronco a 90 graus com halteres pendendo abaixo.",
          "Execute 15 reps na carga normal com técnica perfeita.",
          "Reduza 30% da carga imediatamente sem descanso.",
          "Execute mais 15 reps até a falha."
        ],
        proTips: [
          "Tronco a 90° isola completamente o deltoide posterior.",
          "Foco na contração no pico — não na carga."
        ],
        commonErrors: [
          "Levantar o tronco para usar impulso.",
          "Usar carga que não permite técnica adequada."
        ]
      },
      {
        id: "ex-elite-o3-2",
        name: "Face Pull com Corda (Alta Frequência)",
        series: 5,
        reps: "20",
        restTime: "45s",
        muscleGroup: "Ombros",
        description: "Alta frequência e volume para fortalecer rotadores externos e prevenir lesões.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-tricep-pushdowns-23434-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4164767/pexels-photo-4164767.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Ajuste o cabo na altura dos olhos com a corda.",
          "Puxe a corda em direção ao rosto separando as mãos ao final.",
          "No pico: cotovelos altos, mãos separadas e rotação externa máxima.",
          "Retorne lentamente à posição inicial."
        ],
        proTips: [
          "Separe as mãos ao máximo para rotação externa completa.",
          "5 séries de 20 reps criam proteção articular a longo prazo."
        ],
        commonErrors: [
          "Deixar os cotovelos caírem abaixo dos ombros.",
          "Não separar completamente as mãos no pico."
        ]
      },
      {
        id: "ex-elite-o3-3",
        name: "Peck Deck Inverso (Cadência Lenta)",
        series: 4,
        reps: "15",
        restTime: "60s",
        muscleGroup: "Ombros",
        description: "Cadência 3-1-3 para tempo sob tensão máximo no deltoide posterior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lateral-raises-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837799/pexels-photo-3837799.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Sente-se de frente ao encosto da máquina peck deck.",
          "Abra os braços lentamente em 3 segundos.",
          "Segure no pico por 1 segundo com máxima contração.",
          "Retorne em 3 segundos resistindo à carga."
        ],
        proTips: [
          "Cadência 3-1-3 = 7 segundos por rep = altíssimo tempo sob tensão.",
          "Rotação externa dos ombros no pico para máxima ativação."
        ],
        commonErrors: [
          "Executar rápido demais, perdendo o benefício da cadência.",
          "Usar carga excessiva que impede a amplitude total."
        ]
      },
      {
        id: "ex-elite-o3-4",
        name: "Elevação Posterior Unilateral com Cabo",
        series: 3,
        reps: "15 cada lado",
        restTime: "60s",
        muscleGroup: "Ombros",
        description: "Isolamento unilateral para corrigir assimetrias no deltoide posterior.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-lateral-raises-23432-large.mp4",
        thumbnail: "https://images.pexels.com/photos/3837799/pexels-photo-3837799.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Segure o cabo com uma mão cruzando o corpo (cabo na altura do peito).",
          "Incline levemente o tronco à frente.",
          "Puxe o cabo para o lado e para trás em arco até a altura do ombro.",
          "Retorne lentamente à posição inicial."
        ],
        proTips: [
          "Unilateral permite foco total em cada lado para corrigir diferenças.",
          "Contraia o deltoide posterior no pico por 1 segundo."
        ],
        commonErrors: [
          "Usar o trapézio para elevar o braço.",
          "Não completar o arco — parar antes do pico de contração."
        ]
      }
    ]
  },
  {
    id: "elite-full-1",
    name: "Full Body Atleta",
    muscleGroup: "Full Body",
    level: "Avançado",
    duration: "90 min",
    carga: "Alta",
    description: "Condicionamento total estilo atleta de elite.",
    planRequired: "Elite",
    authorUid: "system",
    exercises: [
      {
        id: "ex-22",
        name: "Levantamento Terra",
        series: 5,
        reps: "5",
        restTime: "180s",
        muscleGroup: "Full Body",
        description: "Exercício composto fundamental para força total.",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-doing-deadlift-exercise-23441-large.mp4",
        thumbnail: "https://images.pexels.com/photos/4162587/pexels-photo-4162587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        instructions: [
          "Posicione-se com os pés na largura dos quadris, barra sobre o meio do pé.",
          "Agache e segure a barra com as mãos logo fora das pernas, coluna neutra.",
          "Empurre o chão com os pés, levante a barra mantendo-a próxima ao corpo.",
          "Estenda os quadris e joelhos simultaneamente até ficar em pé, então desça com controle."
        ],
        proTips: [
          "Imagine que está 'empurrando o chão para longe' em vez de puxar a barra para cima.",
          "Mantenha a barra em contato com as pernas durante toda a subida para melhor alavanca."
        ],
        commonErrors: [
          "Arredondar a lombar ao iniciar o movimento — o erro mais perigoso do exercício.",
          "Deixar a barra se afastar do corpo durante a execução.",
          "Estender os joelhos antes do quadril, perdendo a alavanca do movimento."
        ]
      }
    ]
  }
];

export const ALL_WORKOUTS = [...BEGINNER_WORKOUTS, ...INTERMEDIATE_WORKOUTS, ...ELITE_WORKOUTS];

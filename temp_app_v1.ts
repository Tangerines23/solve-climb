// ???ㅼ젙 ?곸닔 以묒븰 愿由?export const APP_CONFIG = {
  // API ?ㅼ젙
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.solveclimb.com',
  
  // Google OAuth ?ㅼ젙
  // 諛⑸쾿 1: ?섍꼍蹂???ъ슜 (沅뚯옣)
  // frontend ?대뜑??.env ?뚯씪??留뚮뱾怨?VITE_GOOGLE_CLIENT_ID=your-client-id 異붽?
  // 諛⑸쾿 2: ?ш린??吏곸젒 ?낅젰 (媛쒕컻??
  // GOOGLE_CLIENT_ID: 'your-google-client-id-here',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  
  // ?대뱶誘??대찓??紐⑸줉 (援ш? 濡쒓렇???대찓??
  // ?ㅼ젣 ?대뱶誘??대찓?쇰줈 蹂寃쏀븯?몄슂
  ADMIN_EMAILS: [
    // ?덉떆: 'admin@yourdomain.com',
    // 'another-admin@yourdomain.com',
  ],
  
  // ???뺣낫
  APP_NAME: 'Solve Climb',
  APP_VERSION: '1.0.0',
  
  // ?ㅻ뒛??梨뚮┛吏 ?ㅼ젙
  TODAY_CHALLENGE: {
    id: 'today_challenge_001',
    title: '?ъ튃?곗궛 ?ㅽ뵾?쒕윴!',
    category: '?섑븰',
    topic: '?㏃뀍',
    mode: 'time_attack',
    level: 5,
  },
  
  // 移댄뀒怨좊━ ?ㅼ젙
  CATEGORIES: [
    {
      id: 'math',
      name: '?섑븰????,
      icon: '??,
      totalLevels: 20,
    },
    {
      id: 'language',
      name: '?몄뼱????,
      icon: '??,
      totalLevels: 20,
    },
    {
      id: 'logic',
      name: '?쇰━????,
      icon: '?㎥',
      totalLevels: 15,
    },
    {
      id: 'general',
      name: '?곸떇????,
      icon: '?뱴',
      totalLevels: 20,
    },
  ],
  
  // ?쇱슦??寃쎈줈
  ROUTES: {
    HOME: '/',
    CATEGORY_SELECT: '/category-select',
    SUB_CATEGORY: '/subcategory',
    LEVEL_SELECT: '/level-select',
    GAME: '/math-quiz',
    RESULT: '/result',
    RANKING: '/ranking',
    CHALLENGE: '/challenge',
    MY_PAGE: '/my-page',
    SETTINGS: '/settings',
    NOTIFICATIONS: '/notifications',
  },
  
  // 移댄뀒怨좊━ ID 留ㅽ븨
  CATEGORY_MAP: {
    math: '?섑븰',
    language: '?몄뼱',
    logic: '?쇰━',
    general: '?곸떇',
  },
  
  // ?섏쐞 二쇱젣 紐⑸줉 (SUB_TOPICS)
  SUB_TOPICS: {
    math: [
      { id: 'arithmetic', name: '?ъ튃?곗궛', desc: '?㏃뀍, 類꾩뀍, 怨깆뀍, ?섎닓??, icon: '?? },
      { id: 'equations', name: '諛⑹젙??, desc: '誘몄???X??媛믪쓣 李얠븘蹂댁꽭??, icon: 'x' },
      { id: 'sequence', name: '?섏뿴', desc: '洹쒖튃??李얠븘 ?ㅼ쓬 ?섎? 留욎떠蹂댁꽭??, icon: '?뵢' },
      { id: 'calculus', name: '誘몄쟻遺?, desc: '誘몃텇怨??곷텇??諛곗썙蹂댁꽭??, icon: '?? },
    ],
    language: [
      { id: 'japanese', name: '?쇰낯??, desc: '?덈씪媛?? 媛?移대굹, ?쒖옄 ?숈뒿', icon: '?? },
      { id: 'english', name: '?곸뼱', desc: '湲곗큹 ?곷떒?? 臾몃쾿, ?뚰솕', icon: 'A' },
      { id: 'korean', name: '?쒓?', desc: '留욎땄踰? ?꾩뼱?곌린, 臾몃쾿', icon: '?? },
      { id: 'chinese', name: '以묎뎅??, desc: '?쒖옄, 蹂묒쓬, ?뚰솕', icon: '訝? },
    ],
    logic: [
      { id: 'sequence', name: '?섏뿴', desc: '洹쒖튃??李얠븘蹂댁꽭??, icon: '?뵢' },
      { id: 'pattern', name: '?⑦꽩', desc: '諛섎났?섎뒗 ?⑦꽩??諛쒓껄?섏꽭??, icon: '?봺' },
      { id: 'reasoning', name: '異붾줎', desc: '?쇰━?곸쑝濡??앷컖?대낫?몄슂', icon: '?뮡' },
    ],
    general: [
      { id: 'history', name: '??궗', desc: '?쒓뎅?? ?멸퀎?щ? ?뚯븘蹂댁꽭??, icon: '?뱶' },
      { id: 'science', name: '怨쇳븰', desc: '?먯뿰怨쇳븰???먮━瑜?諛곗썙蹂댁꽭??, icon: '?뵮' },
      { id: 'geography', name: '吏由?, desc: '?섎씪? ?꾩떆瑜??뚯븘蹂댁꽭??, icon: '?뙇' },
      { id: 'culture', name: '臾명솕', desc: '?ㅼ뼇??臾명솕瑜??먰뿕?대낫?몄슂', icon: '?렚' },
    ],
  },

  // ?덈꺼 ?곗씠???뺤쓽 (媛??쒕툕?좏뵿蹂??덈꺼 紐⑸줉)
  LEVELS: {
    math: {
      arithmetic: [
        { level: 1, name: '湲곗큹 ?㏃뀍', description: '???먮━ ???㏃뀍' },
        { level: 2, name: '湲곗큹 類꾩뀍', description: '???먮━ ??類꾩뀍' },
        { level: 3, name: '???먮━ ?㏃뀍', description: '???먮━ ???㏃뀍' },
        { level: 4, name: '???먮━ 類꾩뀍', description: '???먮━ ??類꾩뀍' },
        { level: 5, name: '湲곗큹 怨깆뀍', description: '援ш뎄??湲곗큹' },
        { level: 6, name: '湲곗큹 ?섎닓??, description: '?섎닓??湲곗큹' },
        { level: 7, name: '?쇳빀 ?곗궛', description: '?㏃뀍怨?類꾩뀍 ?쇳빀' },
        { level: 8, name: '怨좉툒 怨깆뀍', description: '???먮━ 怨깆뀍' },
        { level: 9, name: '怨좉툒 ?섎닓??, description: '???먮━ ?섎닓?? },
        { level: 10, name: '醫낇빀 ?곗궛', description: '?ъ튃?곗궛 醫낇빀' },
      ],
      equations: [
        { level: 1, name: '?쇱감 諛⑹젙??湲곗큹', description: 'x + 5 = 10' },
        { level: 2, name: '?쇱감 諛⑹젙??, description: '2x + 3 = 11' },
        { level: 3, name: '?댁감 諛⑹젙??湲곗큹', description: 'x짼 = 4' },
        { level: 4, name: '?댁감 諛⑹젙??, description: 'x짼 + 5x + 6 = 0' },
        { level: 5, name: '?곕┰ 諛⑹젙??, description: '??媛쒖쓽 諛⑹젙?? },
        { level: 6, name: '怨좉툒 ?쇱감 諛⑹젙??, description: '蹂듭옟???쇱감 諛⑹젙?? },
        { level: 7, name: '怨좉툒 ?댁감 諛⑹젙??, description: '蹂듭옟???댁감 諛⑹젙?? },
        { level: 8, name: '怨좉툒 ?곕┰ 諛⑹젙??, description: '??媛??댁긽??諛⑹젙?? },
        { level: 9, name: '遺?깆떇', description: 'x > 5' },
        { level: 10, name: '諛⑹젙??醫낇빀', description: '?ㅼ뼇???좏삎 醫낇빀' },
      ],
      sequence: [
        { level: 1, name: '?깆감?섏뿴 湲곗큹', description: '1, 3, 5, 7...' },
        { level: 2, name: '?깆감?섏뿴', description: '蹂듭옟???깆감?섏뿴' },
        { level: 3, name: '?깅퉬?섏뿴 湲곗큹', description: '2, 4, 8, 16...' },
        { level: 4, name: '?깅퉬?섏뿴', description: '蹂듭옟???깅퉬?섏뿴' },
        { level: 5, name: '?쇰낫?섏튂 ?섏뿴', description: '1, 1, 2, 3, 5...' },
        { level: 6, name: '怨꾩감?섏뿴', description: '李⑥씠媛 蹂?섎뒗 ?섏뿴' },
        { level: 7, name: '議고솕?섏뿴', description: '??닔媛 ?깆감?섏뿴' },
        { level: 8, name: '?섏뿴????, description: '?섏뿴????援ы븯湲? },
        { level: 9, name: '怨좉툒 ?섏뿴', description: '蹂듭옟??洹쒖튃 李얘린' },
        { level: 10, name: '?섏뿴 醫낇빀', description: '?ㅼ뼇???섏뿴 醫낇빀' },
      ],
      calculus: [
        { level: 1, name: '湲곗큹 誘몃텇', description: 'x?우쓽 誘몃텇' },
        { level: 2, name: '?곸닔諛?誘몃텇', description: 'ax?우쓽 誘몃텇' },
        { level: 3, name: '?⑷낵 李⑥쓽 誘몃텇', description: 'f(x) 짹 g(x)??誘몃텇' },
        { level: 4, name: '怨깆쓽 誘몃텇', description: 'f(x)쨌g(x)??誘몃텇' },
        { level: 5, name: '紐レ쓽 誘몃텇', description: 'f(x)/g(x)??誘몃텇' },
        { level: 6, name: '?⑹꽦?⑥닔 誘몃텇', description: 'f(g(x))??誘몃텇' },
        { level: 7, name: '?쇨컖?⑥닔 誘몃텇', description: 'sin(x), cos(x)??誘몃텇' },
        { level: 8, name: '吏?샕룸줈洹?誘몃텇', description: 'e甲, ln(x)??誘몃텇' },
        { level: 9, name: '怨좉툒 誘몃텇', description: '蹂듭옟???⑥닔??誘몃텇' },
        { level: 10, name: '誘몃텇 醫낇빀', description: '?ㅼ뼇??誘몃텇 醫낇빀' },
      ],
    },
    language: {
      japanese: [
        { level: 1, name: '湲곕낯 紐⑥쓬', description: '?? ?? ?? ?? ?? },
        { level: 2, name: 'K??, description: '?? ?? ?? ?? ?? },
        { level: 3, name: 'S??, description: '?? ?? ?? ?? ?? },
        { level: 4, name: 'T??, description: '?? ?? ?? ?? ?? },
        { level: 5, name: 'N??, description: '?? ?? ?? ?? ?? },
        { level: 6, name: 'H??, description: '?? ?? ?? ?? ?? },
        { level: 7, name: 'M??, description: '?? ?? ?, ?? ?? },
        { level: 8, name: 'Y??, description: '?? ?? ?? },
        { level: 9, name: 'R??, description: '?? ?? ?? ?? ?? },
        { level: 10, name: '?덈씪媛??醫낇빀', description: '?꾩껜 ?덈씪媛?? },
      ],
      english: [
        { level: 1, name: '湲곗큹 ?⑥뼱', description: 'Apple, Book, Cat' },
        { level: 2, name: '?쇱긽 ?⑥뼱', description: 'Hello, World, Friend' },
        { level: 3, name: '?숇Ъ', description: 'Dog, Cat, Bird' },
        { level: 4, name: '?됯퉼', description: 'Red, Blue, Green' },
        { level: 5, name: '?レ옄', description: 'One, Two, Three' },
        { level: 6, name: '媛議?, description: 'Father, Mother, Sister' },
        { level: 7, name: '?뚯떇', description: 'Food, Water, Bread' },
        { level: 8, name: '?숆탳', description: 'School, Teacher, Student' },
        { level: 9, name: '媛먯젙', description: 'Happy, Sad, Angry' },
        { level: 10, name: '?곷떒??醫낇빀', description: '?ㅼ뼇???⑥뼱 醫낇빀' },
      ],
      korean: [
        { level: 1, name: '湲곕낯 留욎땄踰?, description: '湲곗큹 ?꾩뼱?곌린' },
        { level: 2, name: '?꾩뼱?곌린', description: '?꾩뼱?곌린 洹쒖튃' },
        { level: 3, name: '諛쏆묠 洹쒖튃', description: '諛쏆묠 ?ъ슜踰? },
        { level: 4, name: '?대? 蹂??, description: '?대? ?쒖슜' },
        { level: 5, name: '?믪엫留?, description: '議대뙎留먭낵 諛섎쭚' },
        { level: 6, name: '?꾩뼱?곌린 ?ы솕', description: '蹂듭옟???꾩뼱?곌린' },
        { level: 7, name: '留욎땄踰??ы솕', description: '?대젮??留욎땄踰? },
        { level: 8, name: '臾몄옣 援ъ“', description: '臾몄옣 援ъ꽦' },
        { level: 9, name: '?쒖???, description: '?쒖???洹쒖튃' },
        { level: 10, name: '?쒓? 醫낇빀', description: '留욎땄踰?醫낇빀' },
      ],
      chinese: [
        { level: 1, name: '湲곕낯 ?쒖옄', description: '訝, 雅? 訝? ?? 雅? },
        { level: 2, name: '?쇱긽 ?쒖옄', description: '雅? 鸚? 弱? 訝? ?? },
        { level: 3, name: '媛議??쒖옄', description: '?? 驪? 耶? 也? ?? },
        { level: 4, name: '?쒓컙 ?쒖옄', description: '亮? ?? ?? ?? ?? },
        { level: 5, name: '諛⑺뼢 ?쒖옄', description: '?? 蜈? ?? ?? 訝? },
        { level: 6, name: '?먯뿰 ?쒖옄', description: '掠? 麗? ?? ?? ?? },
        { level: 7, name: '?됯퉼 ?쒖옄', description: '榮? ?? 泳? ?? 容? },
        { level: 8, name: '?レ옄 ?쒖옄', description: '?? ?? ?? ?? ?? },
        { level: 9, name: '怨좉툒 ?쒖옄', description: '蹂듭옟???쒖옄 ?숈뒿' },
        { level: 10, name: '以묎뎅??醫낇빀', description: '?ㅼ뼇???쒖옄 醫낇빀' },
      ],
    },
    logic: {
      sequence: [
        { level: 1, name: '湲곕낯 ?⑦꽩', description: '媛꾨떒??洹쒖튃 李얘린' },
        { level: 2, name: '?レ옄 ?⑦꽩', description: '?レ옄 洹쒖튃' },
        { level: 3, name: '?꾪삎 ?⑦꽩', description: '?꾪삎 洹쒖튃' },
        { level: 4, name: '?됯퉼 ?⑦꽩', description: '?됯퉼 洹쒖튃' },
        { level: 5, name: '蹂듭옟???⑦꽩', description: '?щ윭 洹쒖튃 ?쇳빀' },
        { level: 6, name: '?쒓컙 ?⑦꽩', description: '?쒓컙 ?쒖꽌' },
        { level: 7, name: '怨듦컙 ?⑦꽩', description: '?꾩튂 洹쒖튃' },
        { level: 8, name: '怨좉툒 ?⑦꽩', description: '蹂듭옟??洹쒖튃' },
        { level: 9, name: '異붿긽 ?⑦꽩', description: '異붿긽??洹쒖튃' },
        { level: 10, name: '?⑦꽩 醫낇빀', description: '?ㅼ뼇???⑦꽩 醫낇빀' },
      ],
      pattern: [
        { level: 1, name: '諛섎났 ?⑦꽩', description: '諛섎났?섎뒗 ?⑦꽩' },
        { level: 2, name: '?移??⑦꽩', description: '?移?援ъ“' },
        { level: 3, name: '利앷? ?⑦꽩', description: '?먯젏 而ㅼ????⑦꽩' },
        { level: 4, name: '媛먯냼 ?⑦꽩', description: '?먯젏 ?묒븘吏???⑦꽩' },
        { level: 5, name: '援먯감 ?⑦꽩', description: '援먯감?섎뒗 ?⑦꽩' },
        { level: 6, name: '?쒗솚 ?⑦꽩', description: '?쒗솚?섎뒗 ?⑦꽩' },
        { level: 7, name: '議고빀 ?⑦꽩', description: '?щ윭 ?⑦꽩 議고빀' },
        { level: 8, name: '蹂???⑦꽩', description: '蹂?뺣맂 ?⑦꽩' },
        { level: 9, name: '怨좉툒 議고빀', description: '蹂듭옟??議고빀' },
        { level: 10, name: '?⑦꽩 留덉뒪??, description: '?⑦꽩 醫낇빀' },
      ],
      reasoning: [
        { level: 1, name: '湲곕낯 異붾줎', description: '媛꾨떒???쇰━ 異붾줎' },
        { level: 2, name: '?곗뿭 異붾줎', description: '?쇰컲?먯꽌 ?뱀닔濡? },
        { level: 3, name: '洹??異붾줎', description: '?뱀닔?먯꽌 ?쇰컲?쇰줈' },
        { level: 4, name: '?좎텛 異붾줎', description: '鍮꾩듂??寃?鍮꾧탳' },
        { level: 5, name: '?멸낵 異붾줎', description: '?먯씤怨?寃곌낵' },
        { level: 6, name: '媛??異붾줎', description: '媛???ㅼ젙' },
        { level: 7, name: '紐⑥닚 異붾줎', description: '紐⑥닚 李얘린' },
        { level: 8, name: '蹂듯빀 異붾줎', description: '?щ윭 異붾줎 ?쇳빀' },
        { level: 9, name: '怨좉툒 異붾줎', description: '蹂듭옟??異붾줎' },
        { level: 10, name: '異붾줎 留덉뒪??, description: '異붾줎 醫낇빀' },
      ],
    },
    general: {
      history: [
        { level: 1, name: '怨좊???, description: '怨좊? ?쒓뎅?? },
        { level: 2, name: '?쇨뎅?쒕?', description: '怨좉뎄?? 諛깆젣, ?좊씪' },
        { level: 3, name: '怨좊젮?쒕?', description: '怨좊젮 ?뺤“' },
        { level: 4, name: '議곗꽑?쒕?', description: '議곗꽑 ?뺤“' },
        { level: 5, name: '洹쇰???, description: '媛쒗빆怨?洹쇰??? },
        { level: 6, name: '?꾨???, description: '?꾨? ?쒓뎅?? },
        { level: 7, name: '?멸퀎 怨좊???, description: '怨좊? ?멸퀎?? },
        { level: 8, name: '?멸퀎 以묒꽭??, description: '以묒꽭 ?멸퀎?? },
        { level: 9, name: '?멸퀎 洹쇳쁽???, description: '洹쇳쁽? ?멸퀎?? },
        { level: 10, name: '??궗 醫낇빀', description: '??궗 醫낇빀' },
      ],
      science: [
        { level: 1, name: '臾쇰━ 湲곗큹', description: '湲곕낯 臾쇰━ 踰뺤튃' },
        { level: 2, name: '?뷀븰 湲곗큹', description: '?먯냼? ?뷀빀臾? },
        { level: 3, name: '?앸Ъ 湲곗큹', description: '?앸챸泥댁쓽 援ъ“' },
        { level: 4, name: '吏援ш낵??, description: '吏援ъ? ?곗＜' },
        { level: 5, name: '臾쇰━ ?ы솕', description: '怨좉툒 臾쇰━' },
        { level: 6, name: '?뷀븰 ?ы솕', description: '怨좉툒 ?뷀븰' },
        { level: 7, name: '?앸Ъ ?ы솕', description: '怨좉툒 ?앸Ъ' },
        { level: 8, name: '怨쇳븰 ?ㅽ뿕', description: '?ㅽ뿕 ?먮━' },
        { level: 9, name: '怨쇳븰 ?대줎', description: '怨쇳븰 ?대줎' },
        { level: 10, name: '怨쇳븰 醫낇빀', description: '怨쇳븰 醫낇빀' },
      ],
      geography: [
        { level: 1, name: '?쒓뎅 吏由?, description: '?쒓뎅??吏?? },
        { level: 2, name: '?꾩떆??, description: '?꾩떆??援???? },
        { level: 3, name: '?좊읇', description: '?좊읇 援???? },
        { level: 4, name: '?꾨찓由ъ뭅', description: '遺곷?? ?⑤?' },
        { level: 5, name: '?꾪봽由ъ뭅', description: '?꾪봽由ъ뭅 ?瑜? },
        { level: 6, name: '?ㅼ꽭?꾨땲??, description: '?ㅼ꽭?꾨땲??吏?? },
        { level: 7, name: '?꾩떆', description: '二쇱슂 ?꾩떆?? },
        { level: 8, name: '?먯뿰 吏??, description: '?? 媛? 諛붾떎' },
        { level: 9, name: '湲고썑', description: '湲고썑? ?좎뵪' },
        { level: 10, name: '吏由?醫낇빀', description: '吏由?醫낇빀' },
      ],
      culture: [
        { level: 1, name: '?쒓뎅 臾명솕', description: '?쒓뎅???꾪넻 臾명솕' },
        { level: 2, name: '?뚯븙', description: '?멸퀎 ?뚯븙' },
        { level: 3, name: '誘몄닠', description: '?뚰솕? 議곌컖' },
        { level: 4, name: '臾명븰', description: '?멸퀎 臾명븰' },
        { level: 5, name: '?곹솕', description: '?곹솕? ?곸긽' },
        { level: 6, name: '?붾━', description: '?멸퀎 ?붾━' },
        { level: 7, name: '異뺤젣', description: '?멸퀎 異뺤젣' },
        { level: 8, name: '醫낃탳', description: '?멸퀎 醫낃탳' },
        { level: 9, name: '?띿뒿', description: '?꾪넻 ?띿뒿' },
        { level: 10, name: '臾명솕 醫낇빀', description: '臾명솕 醫낇빀' },
      ],
    },
  },
} as const;


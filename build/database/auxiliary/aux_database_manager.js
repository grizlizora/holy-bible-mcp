/**
 * 📚 AuxDatabaseManager — Manages auxiliary in-memory database with commentaries & concepts
 */
import Database from 'better-sqlite3';
export class AuxDatabaseManager {
    static instance = null;
    static getAuxDb() {
        if (!this.instance) {
            this.instance = new Database(':memory:');
            this.instance.pragma('journal_mode = WAL');
            this.instance.pragma('synchronous = NORMAL');
            this.instance.pragma('temp_store = MEMORY');
            this.initSchema(this.instance);
        }
        return this.instance;
    }
    static initSchema(db) {
        db.exec(`
      CREATE TABLE IF NOT EXISTS commentaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book TEXT,
        chapter INTEGER,
        verse INTEGER,
        author TEXT,
        era TEXT,
        commentary_text TEXT
      );

      CREATE TABLE IF NOT EXISTS semantic_concepts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        concept_name TEXT,
        keywords TEXT,
        book TEXT,
        chapter INTEGER,
        verse INTEGER,
        theological_principle TEXT
      );

      INSERT INTO commentaries (book, chapter, verse, author, commentary_text) VALUES 
      ('JHN', 3, 16, 'John Chrysostom', 'God so loved the world that He gave His only begotten Son. This is the supreme demonstration of sacrificial covenantal love (Agape).'),
      ('JN', 3, 16, 'John Chrysostom', 'God so loved the world that He gave His only begotten Son. This is the supreme demonstration of sacrificial covenantal love (Agape).'),
      ('JHN', 3, 16, 'Matthew Henry', 'Faith in Christ is the single divine means of salvation from eternal ruin and receiving everlasting life.'),
      ('JN', 3, 16, 'Matthew Henry', 'Faith in Christ is the single divine means of salvation from eternal ruin and receiving everlasting life.'),
      ('JHN', 3, 16, 'Charles Spurgeon', 'To believe in Jesus is to trust Him entirely with our whole soul. God gives eternal life as a free covenant gift.'),
      ('PSA', 23, 1, 'Ivan Ohiyenko', 'The Pastoral Psalm expresses absolute trust in God as the Caring Shepherd during times of testing.'),
      ('PS', 23, 1, 'Ivan Ohiyenko', 'The Pastoral Psalm expresses absolute trust in God as the Caring Shepherd during times of testing.'),
      ('PSA', 23, 1, 'Augustine of Hippo', 'The Lord is my shepherd, I shall not want; for in the pastures of His truth He feeds me.'),
      ('ROM', 8, 28, 'John Chrysostom', 'God sovereignly turns even afflictions and trials into spiritual good for those who love Him.'),
      ('ROM', 8, 28, 'Matthew Henry', 'All providences, whether pleasant or painful, are working harmoniously under divine orchestration for the saints good.'),
      ('GEN', 1, 1, 'Basil the Great', 'In the beginning God created the heavens and the earth ex-nihilo by His sovereign word.'),
      ('PHP', 4, 6, 'Charles Spurgeon', 'Be anxious for nothing; prayer is the best remedy for care. Cast the burden on the Lord in thanksgiving.');

      INSERT INTO semantic_concepts (concept_name, keywords, book, chapter, verse, theological_principle) VALUES 
      ('anxiety', 'anxiety fear worry care distress terror panic doubt', 'PHP', 4, 6, 'Be anxious for nothing, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.'),
      ('loneliness', 'lonely abandoned isolated alone forsaken widow orphan rejected', 'PSA', 27, 10, 'When my father and my mother forsake me, then the Lord will take me up.'),
      ('financial trials', 'money debt poverty scarcity risk provision inflation work', 'PROV', 13, 11, 'Wealth gained hastily will dwindle, but whoever gathers little by little will increase it.'),
      ('forgiveness', 'offense anger forgive enemy grudge bitterness pardon reconcile', 'EPH', 4, 32, 'Be kind to one another, tenderhearted, forgiving one another, even as God in Christ forgave you.'),
      ('justification', 'faith grace law works justification righteous credited imputation', 'ROM', 3, 24, 'Being justified freely by His grace through the redemption that is in Christ Jesus.'),
      ('suffering', 'suffering trial pain disease illness patience endurance tribulation', 'ROM', 5, 3, 'We also glory in tribulations, knowing that tribulation produces perseverance; and perseverance, character; and character, hope.'),
      ('peace', 'peace calm storm tempest rest quietness assurance refuge', 'JHN', 16, 33, 'These things I have spoken to you, that in Me you may have peace. In the world you will have tribulation; but be of good cheer, I have overcome the world.'),
      ('covenant love', 'hesed loyalty faithfulness promise covenant mercy unchanging', 'LAM', 3, 22, 'Through the Lords mercies we are not consumed, because His compassions fail not. They are new every morning.'),
      ('repentance', 'repent sin confession guilt clean heart renewal wash', '1JN', 1, 9, 'If we confess our sins, He is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.'),
      ('eternal life', 'eternal life safe preserve hold hand lose never perish salvation', 'JHN', 10, 28, 'And I give them eternal life, and they shall never perish; neither shall anyone snatch them out of My hand.');
    `);
    }
}

const { Pool } = require('pg');

/**
 * Seeder builds a dataset of 105,000+ unique search queries
 * by dynamically cross-combining high-popularity root keywords with
 * common modifiers, suffixes, and years.
 *
 * Counts are assigned using Zipf's Law distribution (power-law)
 * to replicate realistic search volume behaviors in search engines.
 */
async function seed(pool) {
    console.log('[Seeder] Starting data generation...');
    
    // Check if database already holds the minimum dataset size
    try {
        const checkRes = await pool.query('SELECT COUNT(*) FROM searches');
        const existingCount = parseInt(checkRes.rows[0].count, 10);
        if (existingCount >= 100000) {
            console.log(`[Seeder] Database already populated with ${existingCount} queries. Skipping seed.`);
            return;
        }
    } catch (err) {
        console.error('[Seeder] Failed to check database occupancy:', err.message);
        // Table might not exist yet, but server.js runs migration checks first.
        return;
    }

    const roots = [
        'iphone', 'samsung', 'javascript', 'python', 'tutorial', 'react', 'how to', 'best shoes',
        'pizza recipe', 'running', 'movies', 'flights to', 'weather in', 'amazon', 'google', 'github',
        'netflix', 'youtube', 'chatgpt', 'machine learning', 'artificial intelligence', 'data science',
        'software engineering', 'web development', 'node js', 'express js', 'postgresql', 'redis',
        'docker compose', 'kubernetes', 'aws cloud', 'azure devops', 'golang', 'rust programming',
        'html css', 'typescript', 'angular framework', 'vue js', 'next js', 'tailwind css',
        'bootstrap', 'sql query', 'mongodb database', 'sqlite', 'django framework', 'flask api',
        'spring boot', 'java tutorial', 'c++ programming', 'c# dotnet', 'ruby on rails', 'php laravel',
        'swift ios', 'kotlin android', 'flutter apps', 'react native', 'electron desktop',
        'rest api design', 'graphql tutorial', 'grpc microservices', 'oauth2 authentication',
        'jwt tokens', 'git command', 'linux command line', 'windows powershell', 'bash scripting',
        'data structures', 'algorithms practice', 'leetcode solutions', 'system design interview',
        'cryptocurrency trading', 'bitcoin wallet', 'ethereum gas fee', 'stock market analysis',
        'personal finance', 'investment guide', 'credit card rewards', 'mortgage rate calculator',
        'real estate investing', 'home buying tips', 'car rental deals', 'hotel booking discount',
        'cheap flights search', 'travel itinerary planning', 'packing list vacation', 'road trip routes',
        'hiking trails near me', 'national parks guide', 'camping gear checklist', 'outdoor survival tips',
        'fitness workout routine', 'weight loss meal plan', 'high protein diet', 'keto recipe book',
        'vegetarian meals', 'vegan restaurant near me', 'gluten free baking', 'coffee brewing methods',
        'sourdough bread making', 'chocolate chip cookie', 'air fryer chicken', 'slow cooker soup',
        'healthy breakfast ideas', 'easy dinner recipes', 'meal prep sunday', 'groceries delivery app',
        'yoga for beginners', 'meditation guide free', 'mental health self care', 'sleep sounds white noise',
        'running shoes review', 'gym membership deals', 'home workout equipment', 'resistance bands exercise',
        'cycling route planner', 'swimming techniques', 'marathon training plan', 'sports news update',
        'football live score', 'basketball match highlights', 'baseball standings', 'tennis tournament bracket',
        'golf swing analysis', 'soccer training drills', 'skateboarding tricks', 'snowboarding gear',
        'photography tutorial', 'video editing software', 'graphic design tools', 'ui ux portfolio',
        'digital marketing strategy', 'seo keyword research', 'social media management', 'email campaign template',
        'copywriting tips', 'content creation guide', 'podcasting equipment setup', 'blog writing ideas',
        'house plants care', 'gardening tips spring', 'interior design trends', 'home renovation ideas',
        'diy wood projects', 'knitting pattern free', 'crochet stitches guide', 'painting techniques watercolor',
        'drawing tutorials basic', 'calligraphy alphabet', 'origami instructions step by step', 'magic tricks revealed',
        'chess openings strategy', 'board games family', 'video games releases 2026', 'gaming pc build guide',
        'playstation console deal', 'xbox game pass list', 'nintendo switch games', 'steam summer sale discount',
        'dungeons and dragons campaign', 'anime streaming watch online', 'manga reader app', 'cosplay costume ideas',
        'movie review website', 'tv show recommendations', 'documentary films history', 'podcasts spotify top',
        'audiobooks download free', 'music playlist study', 'guitar chords songs', 'piano tutorial scales',
        'singing exercises warm up', 'music production tutorial', 'dj mixer software', 'concert tickets tracker'
    ];

    const modifiers = [
        'tutorial', 'guide', 'documentation', 'examples', 'cheatsheet', 'tips', 'best practices',
        'for beginners', 'in depth', 'advanced course', 'certification exam', 'interview questions',
        'salary details', 'jobs near me', 'remote jobs', 'freelance work', 'github repository',
        'free download', 'pdf book', 'online compiler', 'code sandbox', 'visual studio code setup',
        'configuration template', 'error troubleshooting', 'bug fix stackoverflow', 'latest version features',
        'release notes 2026', 'roadmap outline', 'learning path recommendations', 'books to read',
        'podcasts to listen to', 'youtube channels', 'courses online free', 'reddit discussion thread',
        'comparison vs others', 'pros and cons review', 'alternatives list', 'performance benchmark',
        'scalability patterns', 'security vulnerabilities', 'best security practices', 'api specification reference',
        'npm package setup', 'docker container setup', 'config settings environment', 'debugging tool custom',
        'unit testing framework', 'integration test script', 'ci cd pipeline pipeline', 'deployment cloud setup',
        'monitoring tools dashboard', 'logging library setup', 'error handling patterns', 'validation schema custom',
        'database schema model', 'index optimization query', 'performance tuning query', 'caching strategy redis',
        'cluster replication setup', 'backup restore procedure', 'migration script postgres', 'seeding initial data',
        'mock data generator', 'cli arguments options', 'keyboard shortcuts layout', 'plugin extension install',
        'theme customization custom', 'dark mode setting css', 'responsive grid layout', 'flexbox positioning flex',
        'animations transition keyframes', 'accessibility compliance wcag', 'semantic markup elements',
        'seo optimization checklist', 'analytics tag tracking', 'performance score lighthouse', 'p95 latency threshold',
        'load testing script k6', 'stress test scenarios', 'failover test plan', 'recovery plan disaster',
        'data compression algorithm', 'encryption algorithms standard', 'hashing functions comparison',
        'uuid vs auto increment', 'pagination strategies cursor', 'sorting algorithm visualization',
        'search optimization autocomplete', 'matching suggestions ranking', 'decay score mathematical calculation',
        'consistent hashing ring mapping', 'virtual nodes count density', 'weight distribution load balancer',
        'upstream proxy nginx', 'ssl certificate let\'s encrypt', 'domain registration dynamic dns'
    ];

    // Generate queries by joining roots and modifiers
    const generated = [];
    const querySet = new Set();

    // 1. Root + Modifier
    for (let r = 0; r < roots.length; r++) {
        for (let m = 0; m < modifiers.length; m++) {
            const query = `${roots[r]} ${modifiers[m]}`;
            if (!querySet.has(query)) {
                querySet.add(query);
                generated.push(query);
            }
        }
    }

    // 2. Permutation with additional suffixes to reach 105,000
    const extraSuffixes = ['2026', 'v2', 'pro', 'lite', 'ultimate', 'edition', 'online', 'latest', 'new', 'update'];
    
    let rootIndex = 0;
    let modIndex = 0;
    let suffixIndex = 0;
    
    while (generated.length < 105000) {
        const root = roots[rootIndex % roots.length];
        const mod = modifiers[modIndex % modifiers.length];
        const suffix = extraSuffixes[suffixIndex % extraSuffixes.length];
        
        let query = '';
        if (suffixIndex % 2 === 0) {
            query = `${root} ${mod} ${suffix}`;
        } else {
            query = `${root} ${suffix} ${mod}`;
        }
        
        if (!querySet.has(query)) {
            querySet.add(query);
            generated.push(query);
        }
        
        rootIndex++;
        if (rootIndex % roots.length === 0) {
            modIndex++;
            if (modIndex % modifiers.length === 0) {
                suffixIndex++;
            }
        }
    }

    console.log(`[Seeder] Generated ${generated.length} unique queries. Shuffling and writing to Postgres...`);

    // Shuffle so roots are distributed rather than strictly alphabetical
    for (let i = generated.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [generated[i], generated[j]] = [generated[j], generated[i]];
    }

    const batchSize = 4000;
    const now = Date.now();
    const C = 1000000; // Zipf base popularity

    for (let i = 0; i < generated.length; i += batchSize) {
        const chunk = generated.slice(i, i + batchSize);
        
        let queryText = 'INSERT INTO searches (query, all_time_count, recent_count, last_searched_at) VALUES ';
        const values = [];
        let paramCounter = 1;

        chunk.forEach((queryStr, idx) => {
            const rank = i + idx + 1;
            // Zipf's Law distribution (power-law)
            const allTimeCount = Math.max(1, Math.floor(C / Math.pow(rank, 0.75)));
            // Set 5% of queries to have recent search traffic for immediate trending demo representation
            const recentCount = idx % 20 === 0 ? Math.floor(allTimeCount * (0.05 + Math.random() * 0.15)) : 0;

            queryText += `($${paramCounter++}, $${paramCounter++}, $${paramCounter++}, $${paramCounter++})`;
            if (idx < chunk.length - 1) queryText += ', ';
            
            values.push(queryStr, allTimeCount, recentCount, now);
        });

        queryText += ' ON CONFLICT (query) DO NOTHING';

        await pool.query(queryText, values);
        if ((i + batchSize) % 20000 === 0 || i + batchSize >= generated.length) {
            console.log(`[Seeder] Seeded ${Math.min(i + batchSize, generated.length)} / ${generated.length} rows...`);
        }
    }
    
    console.log('[Seeder] Database seeding completed successfully.');
}

module.exports = { seed };

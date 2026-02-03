# SUPABASE_SETUP.md

## Supabase Integration Instructions

### Step 1: Create a Supabase Project
1. Go to [Supabase](https://supabase.com/).
2. Sign in or create a new account.
3. Click on "New Project."
4. Fill out the required details:
   - Project name
   - Organization
   - Database password
5. Click on "Create Project."

### Step 2: Configure Database
1. Once your project is created, navigate to the "Database" section.
2. Create your tables and columns using the SQL editor or through the visual editor.

### SQL Schema
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Step 3: Connect Supabase to Your Application
1. Install Supabase client library:
   ```bash
   npm install @supabase/supabase-js
   ```
2. Initialize Supabase in your application:
   ```javascript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = 'https://your-supabase-url.supabase.co';
   const supabaseKey = 'your-anon-or-service-role-key';
   const supabase = createClient(supabaseUrl, supabaseKey);
   ```
3. Use the Supabase client to interact with your database.

### Step 4: Authentication Setup
1. Configure authentication settings in the Supabase dashboard under "Authentication".
2. Implement login and signup functionality using Supabase.

### Conclusion
You now have a complete setup for integrating Supabase into your application!
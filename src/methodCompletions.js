const methodCompletions = {
  express: [
    { name: 'get', 
      description: 'Handle HTTP GET requests', 
      example: `app.get('/users', (req, res) => res.send('User List'));`,
      score: 900
    },
    { name: 'post', 
      description: 'Handle HTTP POST requests', 
      example: `app.post('/users', (req, res) => res.send('User Created'));`,
      score: 600 
    },
    { name: 'put', 
      description: 'Handle HTTP PUT requests', 
      example: `app.put('/users/:id', (req, res) => res.send('User Updated'));`,
      score: 600 
    },
    { name: 'delete', 
      description: 'Handle HTTP DELETE requests', 
      example: `app.delete('/users/:id', (req, res) => res.send('User Deleted'));`,
      score: 600 
    },
    { name: 'use', 
      description: 'Mount middleware or sub-app', 
      example: `app.use(express.json());`,
      score: 600 
    },
    { name: 'listen', 
      description: 'Start the server on a port', 
      example: `app.listen(3000, () => console.log('Server running on port 3000'));`,
      score: 600 
    },
    { name: 'set', 
      description: 'Set application settings', 
      example: `app.set('view engine', 'ejs');`,
      score: 600 
    },
    { name: 'render', 
      description: 'Render a view template', 
      example: `app.get('/', (req, res) => res.render('index'));`,
      score: 600 
    },
    { name: 'send', 
      description: 'Send a response to the client', 
      example: `res.send('Hello, World!');`,
      score: 600 
    },
    { name: 'json', 
      description: 'Send a JSON response', 
      example: `res.json({ message: 'Success' });`,
      score: 600 
    },
    { name: 'status', 
      description: 'Set the response status code', 
      example: `res.status(404).send('Not Found');`,
      score: 600 
    },
    { name: 'redirect', 
      description: 'Redirect to a different URL', 
      example: `res.redirect('/dashboard');`,
      score: 600 
    },
    { name: 'locals', 
      description: 'Access local variables in templates', 
      example: `app.locals.title = 'My App';`,
      score: 600 
    },
    { name: 'params', 
      description: 'Access route parameters', 
      example: `app.get('/users/:id', (req, res) => res.send(req.params.id));`,
      score: 600 
    },
    { name: 'query', 
      description: 'Access query string parameters', 
      example: `app.get('/search', (req, res) => res.send(req.query.q));`,
      score: 600 
    },
    { name: 'body', 
      description: 'Access request body data', 
      example: `app.post('/login', (req, res) => res.send(req.body.username));`,
      score: 600 
    },
    { name: 'headers', 
      description: 'Access request headers', 
      example: `app.get('/', (req, res) => res.send(req.headers['user-agent']));`,
      score: 600 
    },
    { name: 'route', 
      description: 'Define route-specific middleware', 
      example: `app.route('/users').get((req, res) => res.send('Users List'));`,
      score: 600 
    },
    { name: 'all', 
      description: 'Handle all HTTP methods', 
      example: `app.all('/secret', (req, res) => res.send('Secret Page'));`,
      score: 600 
    },
    { name: 'static', 
      description: 'Serve static files', 
      example: `app.use(express.static('public'));`,
      score: 600 
    }
  ],
  
  axios: [
    { name: 'get', 
      description: 'Make a GET request', 
      example: `axios.get('/api/users').then(res => console.log(res.data));`,
      score: 600 
    },
    { name: 'post', 
      description: 'Make a POST request', 
      example: `axios.post('/api/users', { name: 'John' }).then(res => console.log(res.data));`,
      score: 600 
    },
    { name: 'put', 
      description: 'Make a PUT request', 
      example: `axios.put('/api/users/1', { name: 'Jane' }).then(res => console.log(res.data));`,
      score: 600 
    },
    { name: 'delete', 
      description: 'Make a DELETE request', 
      example: `axios.delete('/api/users/1').then(res => console.log(res.data));`,
      score: 600 
    }
  ],
  
  lodash: [
    { name: 'cloneDeep', 
      description: 'Deep clone an object', 
      example: `const obj = { a: 1 }; const newObj = _.cloneDeep(obj);`,
      score: 600 
    },
    { name: 'get', 
      description: 'Get a value from an object by path', 
      example: `const obj = { user: { name: 'John' } }; console.log(_.get(obj, 'user.name'));`,
      score: 600 
    }
  ],
  
  moment: [
    { name: 'format', 
      description: 'Format a date string', 
      example: `console.log(moment().format('YYYY-MM-DD'));`,
      score: 600 
    },
    { name: 'add', 
      description: 'Add time to a date', 
      example: `console.log(moment().add(1, 'day').format());`,
      score: 600 
    }
  ],
  
  chalk: [
    { name: 'red', 
      description: 'Color text red', 
      example: `console.log(chalk.red('Error message'));`,
      score: 600 
    },
    { name: 'bold', 
      description: 'Make text bold', 
      example: `console.log(chalk.bold('Bold text'));`,
      score: 600 
    }
  ],
  
  dotenv: [
    { name: 'config', 
      description: 'Load environment variables from .env', 
      example: `require('dotenv').config(); console.log(process.env.API_KEY);`,
      score: 600 
    }
  ],
  
  mongoose: [
    { name: 'connect', 
      description: 'Connect to MongoDB', 
      example: `mongoose.connect('mongodb://localhost:27017/mydb', { useNewUrlParser: true });`,
      score: 600 
    },
    { name: 'model', 
      description: 'Create a model from a schema', 
      example: `const User = mongoose.model('User', new mongoose.Schema({ name: String }));`,
      score: 600 
    }
  ]
};

export default methodCompletions;
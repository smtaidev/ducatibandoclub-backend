import cors from 'cors'

 const ALLOWED_ORIGINS = [
  'https://5ea6477e3cea.ngrok-free.app',
  'http://10.0.30.47:3000'
]
const corsConfig = () =>
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    maxAge: 3600,
    credentials: true,
  })
 
export default corsConfig
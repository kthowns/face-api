const express = require('express')
const path = require('path')
const { get } = require('request')
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'anutest'
});

connection.connect();

app.get('/checkStudent', (req, res) => {
  const query = 'SELECT * FROM students';

  connection.query(query, (error, results) => {
    if (error) {
      console.error('쿼리 실행 실패:', error);
    } else {
      res.render('checkStudent', { users: results });
    }
  });
});


// Attend 값을 업데이트하는 API
app.post('/updateAttendValue', (req, res) => {
  const { index } = req.body;
  
  const sql = `UPDATE students SET attend = 'o' WHERE st_id = ?`;

  connection.query(sql, [index], (error, results) => {
    if (error) {
      console.error('Error:', error);
      res.status(500).send('Failed to update attend value.');
    } else {
      res.sendStatus(200);
    }
  });
});

const upload = multer();
// 이미지 업로드 처리
app.post('/upload', upload.single('image'), (req, res) => {
  const imageData = req.file;
  const st_name = req.body.st_name;
  const st_number = req.body.st_number;
  const today = req.body.today;

  // 데이터베이스에 저장
  const insertQuery = 'INSERT INTO students (st_name, st_number, today, img) VALUES (?, ?, ?, ?)';
  const values = [st_name, st_number, today, imageData.buffer];

  connection.query(insertQuery, values, (error, results) => {
    if (error) {
      console.error('데이터베이스 저장 실패:', error);
      res.status(500).send('데이터베이스 저장 실패');
    } else {
      console.log('데이터베이스 저장 성공!');
      res.status(200).send('데이터베이스 저장 성공');
    }
  });
});

app.get('/getImages', (req, res) => {
  const query = 'SELECT img FROM students';

  connection.query(query, (error, results) => {
      if (error) {
          console.error(error);
          res.status(500).json({ error: 'Error retrieving images from database' });
      } else {
          res.json({ images: results });
      }
  });
});

app.get('/columnCount', (req, res) => {
  // MySQL 연결
  connection.connect((err) => {
    if (err) {
      console.error('MySQL 연결 실패:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    // 컬럼 수 조회
    connection.query('SELECT * FROM students LIMIT 1', (error, results, fields) => {
      if (error) {
        console.error('쿼리 실행 실패:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      const columnCount = fields.length;
      res.json({ columnCount });
    });
  });
});

app.get('/getImages', (req, res) => {
  const query = 'SELECT img FROM students';

  connection.query(query, (error, results) => {
      if (error) {
          console.error(error);
          res.status(500).json({ error: 'Error retrieving images from database' });
      } else {
          res.json({ images: results });
      }
  });
});

app.use(express.json())

const viewsDir = path.join(__dirname, 'views')
app.use(express.static(viewsDir))
app.use(express.static(path.join(__dirname, './models')))
app.use(express.static(path.join(__dirname, './public')))
app.use(express.static(path.join(__dirname, '../images')))
app.use(express.static(path.join(__dirname, '../media')))
app.use(express.static(path.join(__dirname, '../../weights')))
app.use(express.static(path.join(__dirname, '../../dist')))

app.get('/', (req, res) => res.redirect('/signStudent'))
app.get('/test', (req, res) => res.sendFile(path.join(viewsDir, 'test.html')))
app.get('/checkAttendance', (req, res) => res.sendFile(path.join(viewsDir, 'checkAttendance.html')))
app.get('/signStudent', (req, res) => res.sendFile(path.join(viewsDir, 'signStudent.html')))

app.get('/', (req, res) => res.redirect('/checkAttendance.html'))
app.get('/checkAttendance', (req, res) => res.sendFile(path.join(__dirname, 'checkAttendance.html')))
app.get('/signStudent', (req, res) => res.sendFile(path.join(__dirname, 'signStudent.html')))
app.get('/checkStudent', (req, res) => res.sendFile(path.join(__dirname, 'checkStudent.html')))

app.post('/fetch_external_image', async (req, res) => {
  const { imageUrl } = req.body
  if (!imageUrl) {
    return res.status(400).send('imageUrl param required')
  }
  try {
    const externalResponse = await request(imageUrl)
    res.set('content-type', externalResponse.headers['content-type'])
    return res.status(202).send(Buffer.from(externalResponse.body))
  } catch (err) {
    return res.status(404).send(err.toString())
  }
})

app.listen(3000, () => console.log('Listening on port 3000!'))

function request(url, returnBuffer = true, timeout = 10000) {
  return new Promise(function(resolve, reject) {
    const options = Object.assign(
      {},
      {
        url,
        isBuffer: true,
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
        }
      },
      returnBuffer ? { encoding: null } : {}
    )

    get(options, function(err, res) {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}
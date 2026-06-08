import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Database: SQLite (stokvelhub.db)`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

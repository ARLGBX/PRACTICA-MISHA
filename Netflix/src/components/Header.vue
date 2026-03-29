<template>
  <div class="container">

    <nav class="navbar">
      <div class="logo">NETFLIX</div>

      <input class="search" type="text" placeholder="Поиск..." />

      <div class="nav-controls">
        <select>
          <option>Категории</option>
          <option>Категория 1</option>
          <option>Категория 2</option>
        </select>

        <select>
          <option>Сортировка</option>
          <option>По дате</option>
          <option>По цене</option>
          <option>По рейтингу</option>
        </select>
      </div>
    </nav>

    <div class="catalog">
      <div class="card" v-for="i in 12" :key="i">
        <div class="image"></div>
        <h3>Название</h3>
        <p>Описание элемента...</p>
        <span class="price">₸ 10 000</span>
      </div>
    </div>

    <div class="load-more">
      <button>Показать еще</button>
    </div>

  </div>
</template>

<style scoped>
.container {
  max-width: 1300px;
  margin: 0 auto;
  background: #141414;
  min-height: 100vh;
  color: #fff;
  font-family: Arial, sans-serif;
}

.navbar {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: #111;
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo {
  font-weight: bold;
  font-size: 18px;
  color: #e50914;
}

.search {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: #2b2b2b;
  color: #fff;
}

.nav-controls {
  display: flex;
  gap: 10px;
}

.nav-controls select {
  padding: 8px;
  border-radius: 6px;
  border: none;
  background: #2b2b2b;
  color: #fff;
}

.catalog {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 18px;
  padding: 20px;
}

.card {
  background: #1c1c1c;
  border-radius: 10px;
  overflow: hidden;
  transition: 0.3s ease;
  cursor: pointer;
}

.card:hover {
  transform: scale(1.08);
  z-index: 2;
}

.image {
  height: 120px;
  background: linear-gradient(135deg, #333, #111);
}

.card h3 {
  font-size: 15px;
  margin: 10px;
}

.card p {
  font-size: 13px;
  color: #aaa;
  margin: 0 10px;
}

.price {
  display: block;
  margin: 10px;
  color: #e50914;
  font-weight: bold;
}

.load-more {
  margin: 30px;
  text-align: center;
}

.load-more button {
  padding: 12px 25px;
  border: none;
  border-radius: 6px;
  background: #e50914;
  color: white;
  font-weight: bold;
  cursor: pointer;
}

.load-more button:hover {
  background: #b20710;
}
</style>
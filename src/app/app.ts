import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// 1. Restauramos las rutas de tus componentes originales
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  // 2. Volvemos a colocar Header y Footer en los imports
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'ingenieria-para-todos';
}
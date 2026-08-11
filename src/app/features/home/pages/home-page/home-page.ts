import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
})
export class Home {
  capitulos = [
    { 
      id: 1, 
      titulo: 'Ecuaciones Lineales', 
      descripcion: 'Sistemas de ecuaciones, reducción por filas y formas escalonadas.', 
      color: 'border-blue-900' 
    },
    { 
      id: 2, 
      titulo: 'Álgebra de Matrices', 
      descripcion: 'Operaciones con matrices, inversas y particiones de matrices.', 
      color: 'border-stone-400' 
    },
    { 
      id: 3, 
      titulo: 'Determinantes', 
      descripcion: 'Introducción a los determinantes, propiedades y regla de Cramer.', 
      color: 'border-blue-900' 
    },
    { 
      id: 4, 
      titulo: 'Espacios Vectoriales', 
      descripcion: 'Subespacios, espacios nulos, bases, dimensión y rango.', 
      color: 'border-stone-400' 
    }
  ];
}
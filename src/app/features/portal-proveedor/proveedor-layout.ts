import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavItem, PanelShell } from '../shared/panel-shell';

@Component({
  selector: 'app-proveedor-layout',
  imports: [RouterOutlet, PanelShell],
  template: `
    <app-panel-shell etiqueta="Portal de proveedores" [nav]="nav">
      <router-outlet />
    </app-panel-shell>
  `,
})
export class ProveedorLayout {
  protected readonly nav: NavItem[] = [
    { label: 'Mis productos', icon: 'checkroom', link: '/proveedor/productos' },
  ];
}

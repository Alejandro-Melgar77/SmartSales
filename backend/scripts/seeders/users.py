from apps.users.models import User, Rol, Permiso
from apps.products.models import Producto, Categoria

def create_permisos():
    """Crear permisos del sistema"""
    print("🔐 Creando permisos del sistema...")
    
    permisos_data = [
        # Módulo: Productos
        {'nombre': 'Ver productos', 'codigo': 'productos.ver', 'modulo': 'productos', 'descripcion': 'Permite ver listado de productos'},
        {'nombre': 'Crear productos', 'codigo': 'productos.crear', 'modulo': 'productos', 'descripcion': 'Permite crear nuevos productos'},
        {'nombre': 'Editar productos', 'codigo': 'productos.editar', 'modulo': 'productos', 'descripcion': 'Permite editar productos existentes'},
        {'nombre': 'Eliminar productos', 'codigo': 'productos.eliminar', 'modulo': 'productos', 'descripcion': 'Permite eliminar productos'},
        
        # Módulo: Usuarios
        {'nombre': 'Ver usuarios', 'codigo': 'usuarios.ver', 'modulo': 'usuarios', 'descripcion': 'Permite ver listado de usuarios'},
        {'nombre': 'Crear usuarios', 'codigo': 'usuarios.crear', 'modulo': 'usuarios', 'descripcion': 'Permite crear nuevos usuarios'},
        {'nombre': 'Editar usuarios', 'codigo': 'usuarios.editar', 'modulo': 'usuarios', 'descripcion': 'Permite editar usuarios existentes'},
        {'nombre': 'Eliminar usuarios', 'codigo': 'usuarios.eliminar', 'modulo': 'usuarios', 'descripcion': 'Permite desactivar usuarios'},
        
        # Módulo: Ventas
        {'nombre': 'Ver ventas', 'codigo': 'ventas.ver', 'modulo': 'ventas', 'descripcion': 'Permite ver historial de ventas'},
        {'nombre': 'Crear ventas', 'codigo': 'ventas.crear', 'modulo': 'ventas', 'descripcion': 'Permite registrar nuevas ventas'},
        {'nombre': 'Anular ventas', 'codigo': 'ventas.anular', 'modulo': 'ventas', 'descripcion': 'Permite anular ventas'},
        
        # Módulo: Reportes
        {'nombre': 'Ver reportes', 'codigo': 'reportes.ver', 'modulo': 'reportes', 'descripcion': 'Permite acceder a reportes'},
        {'nombre': 'Generar reportes', 'codigo': 'reportes.generar', 'modulo': 'reportes', 'descripcion': 'Permite generar nuevos reportes'},
        {'nombre': 'Exportar reportes', 'codigo': 'reportes.exportar', 'modulo': 'reportes', 'descripcion': 'Permite exportar reportes a PDF/Excel'},
        
        # Módulo: Dashboard
        {'nombre': 'Ver dashboard', 'codigo': 'dashboard.ver', 'modulo': 'dashboard', 'descripcion': 'Permite ver el dashboard principal'},
        {'nombre': 'Ver analytics', 'codigo': 'dashboard.analytics', 'modulo': 'dashboard', 'descripcion': 'Permite ver analytics avanzados'},
        
        # Módulo: Sistema
        {'nombre': 'Administrar sistema', 'codigo': 'sistema.admin', 'modulo': 'sistema', 'descripcion': 'Permite administrar configuración del sistema'},
        {'nombre': 'Backup/Restore', 'codigo': 'sistema.backup', 'modulo': 'sistema', 'descripcion': 'Permite realizar backup y restore'},
    ]
    
    permisos_creados = []
    for perm_data in permisos_data:
        permiso, created = Permiso.objects.get_or_create(
            codigo=perm_data['codigo'],
            defaults=perm_data
        )
        status = "✅ CREADO" if created else "📝 EXISTENTE"
        print(f"{status} Permiso: {permiso.codigo}")
        permisos_creados.append(permiso)
    
    return permisos_creados

def create_roles(permisos):
    """Crear roles del sistema"""
    print("🎭 Creando roles del sistema...")
    
    # Mapear permisos por código para fácil acceso
    permisos_dict = {p.codigo: p for p in permisos}
    
    roles_data = [
        {
            'nombre': 'Administrador',
            'descripcion': 'Acceso completo a todo el sistema',
            'nivel_acceso': 10,
            'es_default': False,
            'permisos_codigos': [p.codigo for p in permisos]  # Todos los permisos
        },
        {
            'nombre': 'Vendedor',
            'descripcion': 'Puede gestionar productos y ventas',
            'nivel_acceso': 7,
            'es_default': False,
            'permisos_codigos': [
                'productos.ver', 'productos.crear', 'productos.editar',
                'ventas.ver', 'ventas.crear',
                'reportes.ver', 'reportes.generar',
                'dashboard.ver'
            ]
        },
        {
            'nombre': 'Cliente',
            'descripcion': 'Rol por defecto para clientes',
            'nivel_acceso': 3,
            'es_default': True,
            'permisos_codigos': [
                'productos.ver',
                'dashboard.ver'
            ]
        },
        {
            'nombre': 'Gerente',
            'descripcion': 'Puede gestionar todo excepto configuración del sistema',
            'nivel_acceso': 9,
            'es_default': False,
            'permisos_codigos': [
                p.codigo for p in permisos 
                if not p.codigo.startswith('sistema.')
            ]
        }
    ]
    
    roles_creados = []
    for rol_data in roles_data:
        rol, created = Rol.objects.get_or_create(
            nombre=rol_data['nombre'],
            defaults={
                'descripcion': rol_data['descripcion'],
                'nivel_acceso': rol_data['nivel_acceso'],
                'es_default': rol_data['es_default']
            }
        )
        
        # Asignar permisos al rol
        permisos_rol = [permisos_dict[codigo] for codigo in rol_data['permisos_codigos']]
        rol.permisos.set(permisos_rol)
        
        status = "✅ CREADO" if created else "📝 ACTUALIZADO"
        print(f"{status} Rol: {rol.nombre} - {len(permisos_rol)} permisos")
        roles_creados.append(rol)
    
    return roles_creados

def create_usuarios(roles):
    """Crear usuarios de prueba"""
    print("👤 Creando usuarios de prueba...")
    
    # Mapear roles por nombre
    roles_dict = {r.nombre: r for r in roles}
    
    usuarios_data = [
        # ADMINISTRADOR
        {
            'username': 'admin',
            'email': 'admin@smartsales.com',
            'password': 'admin123',
            'role': 'admin',
            'first_name': 'Ana',
            'last_name': 'Administradora',
            'phone': '+591 12345678',
            'address': 'Oficina Central, La Paz',
            'ciudad': 'La Paz',
            'rol_personalizado': roles_dict['Administrador']
        },
        
        # GERENTE
        {
            'username': 'gerente1',
            'email': 'gerente@smartsales.com',
            'password': 'gerente123',
            'role': 'admin',
            'first_name': 'Roberto',
            'last_name': 'Gutiérrez',
            'phone': '+591 69874521',
            'address': 'Zona Sur, Calle 123',
            'ciudad': 'Santa Cruz',
            'rol_personalizado': roles_dict['Gerente']
        },
        
        # VENDEDORES
        {
            'username': 'vendedor1',
            'email': 'vendedor1@smartsales.com',
            'password': 'vendedor123',
            'role': 'seller',
            'first_name': 'Carlos',
            'last_name': 'Vendedor',
            'phone': '+591 71234567',
            'address': 'Av. Arce 456',
            'ciudad': 'La Paz',
            'rol_personalizado': roles_dict['Vendedor']
        },
        {
            'username': 'vendedor2',
            'email': 'vendedor2@smartsales.com',
            'password': 'vendedor123',
            'role': 'seller',
            'first_name': 'Laura',
            'last_name': 'Vendedora',
            'phone': '+591 72345678',
            'address': 'Zona Norte, Calle 789',
            'ciudad': 'Cochabamba',
            'rol_personalizado': roles_dict['Vendedor']
        },
        
        # CLIENTES
        {
            'username': 'ale',
            'email': 'ale@smartsales.com',
            'password': 'ale123',
            'role': 'customer',
            'first_name': 'Alejandro',
            'last_name': 'Melgar',
            'phone': '+591 76543210',
            'address': 'Av. Siempre Viva 123',
            'ciudad': 'La Paz',
            'rol_personalizado': roles_dict['Cliente']
        },
        {
            'username': 'maria_g',
            'email': 'maria.garcia@email.com',
            'password': 'cliente123',
            'role': 'customer',
            'first_name': 'María',
            'last_name': 'García',
            'phone': '+591 70012345',
            'address': 'Zona Sur, Calle 456',
            'ciudad': 'Santa Cruz',
            'rol_personalizado': roles_dict['Cliente']
        },
        {
            'username': 'carlos_l',
            'email': 'carlos.lopez@email.com',
            'password': 'cliente123',
            'role': 'customer',
            'first_name': 'Carlos',
            'last_name': 'López',
            'phone': '+591 71234567',
            'address': 'Av. Arce 789',
            'ciudad': 'La Paz',
            'rol_personalizado': roles_dict['Cliente']
        },
        {
            'username': 'lucia_m',
            'email': 'lucia.martinez@email.com',
            'password': 'cliente123',
            'role': 'customer',
            'first_name': 'Lucía',
            'last_name': 'Martínez',
            'phone': '+591 72345678',
            'address': 'Zona Norte, Calle 321',
            'ciudad': 'Cochabamba',
            'rol_personalizado': roles_dict['Cliente']
        },
        {
            'username': 'javier_r',
            'email': 'javier.rodriguez@email.com',
            'password': 'cliente123',
            'role': 'customer',
            'first_name': 'Javier',
            'last_name': 'Rodríguez',
            'phone': '+591 73456789',
            'address': 'Barrio Equipetrol',
            'ciudad': 'Santa Cruz',
            'rol_personalizado': roles_dict['Cliente']
        }
    ]
    
    usuarios_creados = 0
    usuarios_existentes = 0
    
    for user_data in usuarios_data:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data['email'],
                'role': user_data['role'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'phone': user_data.get('phone', ''),
                'address': user_data.get('address', ''),
                'ciudad': user_data.get('ciudad', ''),
                'rol_personalizado': user_data.get('rol_personalizado')
            }
        )
        
        if created:
            user.set_password(user_data['password'])
            user.save()
            usuarios_creados += 1
            status = "✅ CREADO"
        else:
            usuarios_existentes += 1
            status = "📝 EXISTENTE"
        
        rol_info = f" - Rol: {user.rol_personalizado.nombre}" if user.rol_personalizado else ""
        print(f"{status} Usuario: {user.username} - {user.get_role_display()}{rol_info}")
    
    return usuarios_creados, usuarios_existentes

def run():
    """Ejecutar seeder completo de usuarios"""
    print("👥 INICIANDO POBLACIÓN DE USUARIOS Y PERMISOS")
    print("=" * 50)
    
    # Crear permisos
    permisos = create_permisos()
    print("-" * 30)
    
    # Crear roles
    roles = create_roles(permisos)
    print("-" * 30)
    
    # Crear usuarios
    usuarios_creados, usuarios_existentes = create_usuarios(roles)
    print("-" * 30)
    
    # Resumen
    print("📊 RESUMEN SISTEMA DE USUARIOS:")
    print(f"   🔐 Permisos: {Permiso.objects.count()}")
    print(f"   🎭 Roles: {Rol.objects.count()}")
    print(f"   👤 Usuarios totales: {User.objects.count()}")
    print(f"   👑 Administradores: {User.objects.filter(role='admin').count()}")
    print(f"   💼 Vendedores: {User.objects.filter(role='seller').count()}")
    print(f"   👥 Clientes: {User.objects.filter(role='customer').count()}")
    print(f"   ✅ Nuevos usuarios: {usuarios_creados}")
    print(f"   📝 Usuarios existentes: {usuarios_existentes}")
    
    return usuarios_creados, usuarios_existentes
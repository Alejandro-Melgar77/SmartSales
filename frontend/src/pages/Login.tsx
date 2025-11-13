import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/users/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // --- 👇 INICIO DE LA CORRECCIÓN ---
        
        // 1. Recibimos la respuesta completa (que debe incluir user y token)
        const data = await response.json(); 

        // 2. Verificamos que la respuesta tenga el token y el usuario
        if (data.user && data.token) {
          
          // 3. Llamamos a la NUEVA función login con AMBOS argumentos
          login(data.user, data.token); 
          
          toast.success(`¡Bienvenido ${data.user.first_name}!`);
          navigate("/");
        } else {
          // Si la respuesta no tiene 'user' o 'token'
          console.error("Respuesta de login inesperada:", data);
          toast.error("Error en el formato de respuesta del servidor.");
        }
        // --- 👆 FIN DE LA CORRECCIÓN ---

      } else {
        const errorData = await response.json();
        toast.error(errorData.error || errorData.detail || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Error de conexión. Verifica que el backend esté ejecutándose.");
    } finally {
      setLoading(false);
    }
  };

  // Datos de prueba para desarrollo
  const fillTestCredentials = (role: string) => {
    const credentials = {
      admin: { username: "admin", password: "admin123" },
      ale: { username: "ale", password: "ale123" },
      vendedor: { username: "vendedor1", password: "vendedor123" }
    };
    
    setFormData(credentials[role as keyof typeof credentials]);
    toast.info(`Credenciales de ${role} cargadas`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
              <CardDescription>
                Accede a tu cuenta de SmartSales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Ingresa tu usuario"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>

              {/* Datos de prueba para desarrollo */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">💡 Datos de prueba:</p>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fillTestCredentials("admin")}
                  >
                    Admin
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fillTestCredentials("ale")}
                  >
                    Ale (Cliente)
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fillTestCredentials("vendedor")}
                  >
                    Vendedor
                  </Button>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  ¿No tienes cuenta?{" "}
                  <Link 
                    to="/register" 
                    className="text-primary hover:underline font-medium"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Login;
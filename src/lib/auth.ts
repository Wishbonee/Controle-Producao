import { Perfil } from '../types';
import { userStorage } from './userStorage';

export interface UserRecord {
  senha: string;
  perfil: Perfil;
  nome: string;
}

// Erros de conexão/banco propagam para a tela de login exibir a mensagem real
export async function authenticate(usuario: string, senha: string): Promise<UserRecord | null> {
  const u = await userStorage.findByLogin(usuario);
  if (u && u.senha === senha && u.ativo) {
    return { senha: u.senha, perfil: u.perfil, nome: u.nome };
  }
  return null;
}

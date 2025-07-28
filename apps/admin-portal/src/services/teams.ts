import { apiService } from './api'
import { Team } from '../types/auth'

export interface CreateTeamRequest {
  name: string
  description?: string
  isActive: boolean
  departmentId: string
  teamLeadId?: string
  city: string
  country: string
  memberCount: number
  maxMembers: number
  skills: string[]
  status: 'Active' | 'Inactive'
  createdAt: string
}

export interface UpdateTeamRequest extends Partial<CreateTeamRequest> {
  id: string
}

export interface TeamMember {
  id: string
  userId: string
  teamId: string
  joinedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar?: string
  }
}

class TeamsService {
  // Get all teams
  async getTeams(): Promise<Team[]> {
    const response = await apiService.getTeams()
    return response.data?.teams || []
  }

  // Get team by ID - using the existing getUserById pattern but for teams
  async getTeam(id: string): Promise<Team | null> {
    const teams = await this.getTeams()
    return teams.find(team => team.id === id) || null
  }

  // Create new team
  async createTeam(teamData: Omit<Team, 'id'>): Promise<Team> {
    const response = await apiService.createTeam(teamData)
    return response.data?.team!
  }

  // Update team
  async updateTeam(id: string, teamData: Partial<Team>): Promise<Team> {
    const response = await apiService.updateTeam(id, teamData)
    return response.data?.team!
  }

  // Delete team
  async deleteTeam(id: string): Promise<void> {
    await apiService.deleteTeam(id)
  }

  // Get teams by department
  async getTeamsByDepartment(departmentId: string): Promise<Team[]> {
    const response = await apiService.getTeams(departmentId)
    return response.data?.teams || []
  }

  // Note: The following methods would require additional API endpoints
  // that are not currently implemented in the main ApiService.
  // They are commented out to prevent compilation errors.

  /*
  // Get team members
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    // This would require a new endpoint in ApiService
    throw new Error('Not implemented - requires backend API endpoint')
  }

  // Add member to team
  async addTeamMember(teamId: string, userId: string): Promise<TeamMember> {
    // This would require a new endpoint in ApiService
    throw new Error('Not implemented - requires backend API endpoint')
  }

  // Remove member from team
  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    // This would require a new endpoint in ApiService
    throw new Error('Not implemented - requires backend API endpoint')
  }

  // Assign team lead
  async assignTeamLead(teamId: string, userId: string): Promise<Team> {
    // This would require a new endpoint in ApiService
    throw new Error('Not implemented - requires backend API endpoint')
  }

  // Remove team lead
  async removeTeamLead(teamId: string): Promise<Team> {
    // This would require a new endpoint in ApiService
    throw new Error('Not implemented - requires backend API endpoint')
  }

  // Search teams
  async searchTeams(query: string): Promise<Team[]> {
    // This would require a new endpoint in ApiService
    throw new Error('Not implemented - requires backend API endpoint')
  }

  // Get team statistics
  async getTeamStats(teamId: string): Promise<{
    totalMembers: number
    activeMembers: number
    averageExperience: number
    skillDistribution: Record<string, number>
  }> {
    // This would require a new endpoint in ApiService
    throw new Error('Not implemented - requires backend API endpoint')
  }
  */
}

export const teamsService = new TeamsService()

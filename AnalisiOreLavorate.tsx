import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SessionForm from "../components/analisi/SessionForm";
import SessionsList from "../components/analisi/SessionsList";
import SessionsChart from "../components/analisi/SessionsChart";
import SessionFilters from "../components/analisi/SessionFilters";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export default function AnalisiOreLavorate() {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    period: 'month',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    client: 'all',
    tag: 'all'
  });

  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['workSessions'],
    queryFn: () => base44.entities.WorkSession.list('-date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkSession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workSessions'] });
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkSession.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workSessions'] });
    }
  });

  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.date);
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    
    const dateMatch = sessionDate >= start && sessionDate <= end;
    const clientMatch = filters.client === 'all' || session.client === filters.client;
    const tagMatch = filters.tag === 'all' || (session.tags && session.tags.includes(filters.tag));
    
    return dateMatch && clientMatch && tagMatch;
  });

  const targetMinutesPerDay = 7 * 60 + 42; // 7h 42m

  const totalMinutes = filteredSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-light">
          Analisi Ore Lavorate
        </h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary-light text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuova Sessione
        </Button>
      </div>

      {showForm && (
        <SessionForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
        />
      )}

      <SessionFilters
        filters={filters}
        onFiltersChange={setFilters}
        sessions={sessions}
      />

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-2 border-primary-light">
          <CardHeader className="bg-gradient-to-r from-primary to-primary-light">
            <CardTitle className="text-white text-center">Ore Totali</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-primary dark:text-primary-light">
              {totalHours}h {totalMins}m
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary-light">
          <CardHeader className="bg-gradient-to-r from-primary to-primary-light">
            <CardTitle className="text-white text-center">Sessioni</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-primary dark:text-primary-light">
              {filteredSessions.length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary-light">
          <CardHeader className="bg-gradient-to-r from-primary to-primary-light">
            <CardTitle className="text-white text-center">Media Giornaliera</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-primary dark:text-primary-light">
              {filteredSessions.length > 0
                ? `${Math.floor(totalMinutes / filteredSessions.length / 60)}h ${Math.round((totalMinutes / filteredSessions.length) % 60)}m`
                : '0h 0m'}
            </div>
          </CardContent>
        </Card>
      </div>

      <SessionsChart
        sessions={filteredSessions}
        targetMinutes={targetMinutesPerDay}
      />

      <SessionsList
        sessions={filteredSessions}
        onDelete={(id) => deleteMutation.mutate(id)}
        isLoading={isLoading}
      />
    </div>
  );
}

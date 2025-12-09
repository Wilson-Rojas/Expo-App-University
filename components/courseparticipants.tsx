import { API_URL } from '@/constants/api';
import { getToken } from '@/hooks/useAuths';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

type Participant = {
  student_id: number;
  student_name: string;
  student_email: string;
  course_title: string;
};

type CourseParticipantsProps = {
  courseId: string | number;
};

// Fetch participants with pagination support (offset, limit)
async function fetchParticipants(courseId: string | number, offset = 0, limit = 10) {
  const token = await getToken();
  const url = `${API_URL}/api/enrollments?course_id=${courseId}&offset=${offset}&limit=${limit}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Error fetching participants');
  }

  const response = await res.json();

  // response may be an array, or an object like { message, code, data } or paginated { data, next_page_url }
  let items: Participant[] = [];
  let hasMore = false;

  if (Array.isArray(response)) {
    items = response;
    hasMore = items.length === limit;
  } else if (Array.isArray(response.data)) {
    items = response.data;
    // paginated API commonly provides next_page_url
    hasMore = response.next_page_url !== undefined ? response.next_page_url !== null : items.length === limit;
  } else if (Array.isArray(response.items)) {
    items = response.items;
    hasMore = items.length === limit;
  } else if (response.message) {
    // message indicates no data
    items = [];
    hasMore = false;
  }

  return { items, hasMore };
}

// Fetch a list of available students to add to the course. The selector modal
// will call this to populate its choices. Supports simple search and pagination.
async function fetchAvailableStudents(courseId: string | number, search = '', offset = 0, limit = 20) {
  const token = await getToken();
  const url = `${API_URL}/api/noenrollments/${courseId}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Error obteniendo estudiantes');
  }

  const resp = await res.json();
  // Support different shapes: array, { data, next_page_url }, { items }
  if (Array.isArray(resp)) return { items: resp, hasMore: resp.length === limit };
  const items = resp.data || resp.items || [];
  const hasMore = resp.next_page_url !== undefined ? resp.next_page_url !== null : items.length === limit;
  return { items, hasMore };
}

// Enroll a student in a course by calling the backend enrollments endpoint.
async function enrollStudent(courseId: string | number, studentId: number | string) {
  const token = await getToken();
  const url = `${API_URL}/api/enrollments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ course_id: courseId, student_id: studentId }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Error enrolling student');
  }

  return await res.json();
}

function ParticipantCard({ participant }: { participant: Participant }) {
  const getInitial = (name: string): string => {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return '?';
    }
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <View style={styles.participantCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {getInitial(participant.student_name)}
        </Text>
      </View>
      <View style={styles.participantInfo}>
        <Text style={styles.participantName}>{participant.student_name}</Text>
        <Text style={styles.participantEmail}>{participant.student_email}</Text>
      </View>
    </View>
  );
}

export default function CourseParticipants({ courseId }: CourseParticipantsProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastFetchAt, setLastFetchAt] = useState(0);
  const LIMIT = 10;

  // --- States for "Add participant" modal and selector ---
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsOffset, setStudentsOffset] = useState(0);
  const [studentsHasMore, setStudentsHasMore] = useState(true);
  const [studentsLoadingMore, setStudentsLoadingMore] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [adding, setAdding] = useState(false);

  // Load initial batch of available students for selector
  const loadStudentsInitial = async (search = '') => {
    setStudentsLoading(true);
    setStudentsOffset(0);
    setStudentsHasMore(true);
    try {
      const { items, hasMore } = await fetchAvailableStudents(courseId, search, 0, 20);
      setStudents(items || []);
      setStudentsOffset((items || []).length);
      setStudentsHasMore(hasMore);
    } catch (err) {
      console.error('Error cargando estudiantes', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudieron cargar estudiantes');
    } finally {
      setStudentsLoading(false);
    }
  };

  // Load more students when scrolling selector
  const loadMoreStudents = async () => {
    if (studentsLoadingMore || !studentsHasMore) return;
    setStudentsLoadingMore(true);
    try {
      const { items, hasMore } = await fetchAvailableStudents(courseId, studentSearch, studentsOffset, 20);
      if (items && items.length) {
        setStudents(prev => [...prev, ...items]);
        setStudentsOffset(prev => prev + items.length);
      }
      setStudentsHasMore(hasMore);
    } catch (err) {
      console.error('Error cargando más estudiantes', err);
    } finally {
      setStudentsLoadingMore(false);
    }
  };

  // Enroll selected student and refresh participants list
  const handleEnrollSelected = async () => {
    if (!selectedStudent) {
      Alert.alert('Selecciona un estudiante');
      return;
    }
    setAdding(true);
    try {
      // student id might be in different field names
      const sid = selectedStudent.student_id || selectedStudent.id || selectedStudent.user_id;
      await enrollStudent(courseId, sid);
      // refresh participants list (first page)
      const { items, hasMore } = await fetchParticipants(courseId, 0, LIMIT);
      setParticipants(items);
      setOffset(items.length);
      setHasMore(hasMore);
      setAddModalVisible(false);
      setSelectedStudent(null);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo agregar participante');
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      setError(null);
      setOffset(0);
      setHasMore(true);
      try {
        const { items, hasMore: more } = await fetchParticipants(courseId, 0, LIMIT);
        if (!mounted) return;
        setParticipants(items);
        setOffset(items.length);
        setHasMore(more);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Error al cargar participantes');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [courseId]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    const now = Date.now();
    if (now - lastFetchAt < 600) return;
    setLastFetchAt(now);
    setLoadingMore(true);
    try {
      const { items, hasMore: more } = await fetchParticipants(courseId, offset, LIMIT);
      if (items && items.length > 0) {
        setParticipants(prev => [...prev, ...items]);
        setOffset(prev => prev + items.length);
      }
      setHasMore(more);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar participantes');
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#20336d" />
        <Text style={styles.loadingText}>Cargando participantes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header row: title + add participant button - SIEMPRE VISIBLE */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Participantes ({participants.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={async () => {
            setAddModalVisible(true);
            setSelectedStudent(null);
            setStudentSearch('');
            await loadStudentsInitial();
          }}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Mostrar lista de participantes o mensaje de vacío */}
      {participants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>No hay participantes inscritos</Text>
        </View>
      ) : (
        <FlatList
          data={participants}
          renderItem={({ item }) => <ParticipantCard participant={item} />}
          keyExtractor={item => item.student_id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 12 }} /> : null}
        />
      )}

      {/* Modal: selector to pick a student from API and enroll them */}
      <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={() => setAddModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Participante</Text>
            {studentsLoading ? (
              <ActivityIndicator style={{ margin: 12 }} />
            ) : (
              <FlatList
                data={students}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.studentItem}
                    onPress={() => setSelectedStudent(item)}
                  >
                    <Text style={styles.studentName}>{item.student_name || item.name || item.full_name}</Text>
                    <Text style={styles.studentSelect}>{selectedStudent === item ? '✓' : ''}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item, i) => (item.student_id || item.id || i).toString()}
                onEndReached={loadMoreStudents}
                onEndReachedThreshold={0.5}
                ListFooterComponent={studentsLoadingMore ? <ActivityIndicator style={{ margin: 12 }} /> : null}
                style={{ maxHeight: 300 }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAddModalVisible(false)}
                disabled={adding}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleEnrollSelected}
                disabled={adding || !selectedStudent}
              >
                {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Agregar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listContent: {
    paddingBottom: 8,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#20336d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  participantEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#20336d',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 22,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 480,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    paddingHorizontal: 4,
  },
  studentName: {
    fontSize: 15,
    color: '#333',
  },
  studentSelect: {
    fontSize: 18,
    color: '#20336d',
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#20336d',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
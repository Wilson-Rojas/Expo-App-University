import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import CourseParticipants from '@/components/courseparticipants';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_URL } from '@/constants/api';
import { getToken } from '@/hooks/useAuths';
import { MaterialIcons } from '@expo/vector-icons';

type Course = {
  id: string;
  title: string;
  description?: string;
  start_date?: string | Date;
  end_date?: string | Date;
};

async function fetchUserProfile() {
  const token = await getToken();
  const url = `${API_URL}/api/user`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Error fetching user');
  }

  const data = await res.json();
  return data.data || data;
}

async function fetchCoursesFromApi(page: number = 1, userId?: number) {
  const token = await getToken();
  
  // If userId is provided, fetch enrolled courses for the student
  if (userId) {
    const url = `${API_URL}/api/enrollments?student_id=${userId}&offset=${(page - 1) * 10}&limit=10`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || 'Error fetching enrollments');
    }

    const data = await res.json();

    if (data.message && !data.data) {
      return { data: [], hasMore: false };
    }

    // Extract course from each enrollment item
    const courses = (data.data || []).map((item: any) => ({
      id: item.course_id || item.id,
      title: item.course?.title || item.title,
      description: item.course?.description || item.description,
      start_date: item.course?.start_date || item.start_date,
      end_date: item.course?.end_date || item.end_date,
    }));

    const hasMore = data.next_page_url !== null || (data.data && data.data.length === 10);

    return { data: courses, hasMore };
  }

  // Otherwise fetch all courses (for instructors - level 1)
  const url = `${API_URL}/api/courses?page=${page}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Error fetching courses');
  }

  const data = await res.json();

  if (data.message && !data.data) {
    return { data: [], hasMore: false };
  }

  const courses = data.data || [];
  const hasMore = data.next_page_url !== null;

  return { data: courses, hasMore };
}

async function createCourse(courseData: {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
}) {
  const token = await getToken();
  const url = `${API_URL}/api/courses`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(courseData),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Error creating course');
  }

  return await res.json();
}

async function updateCourse(courseId: string, courseData: {
  title: string;
  description: string;
}) {
  const token = await getToken();
  const url = `${API_URL}/api/courses/${courseId}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(courseData),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Error updating course');
  }

  return await res.json();
}

function CourseCard({ course, onPress }: { course: Course; onPress: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{course.title}</Text>
      {course.description ? <Text style={styles.cardSubtitle}>{course.description}</Text> : null}
      <TouchableOpacity style={styles.cardButton} activeOpacity={0.8} onPress={onPress}>
        <Text style={styles.cardButtonText}>Ver</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📚</Text>
      <Text style={styles.emptyTitle}>No hay cursos disponibles</Text>
    </View>
  );
}

function CourseDetailModal({
  visible,
  course,
  onClose,
  onEdit,
  userLevel,
}: {
  visible: boolean;
  course: Course | null;
  onClose: () => void;
  onEdit: (course: Course) => void;
  userLevel: number | null;
}) {
  if (!course) return null;

  const formatDate = (date?: string | Date): string => {
    if (!date) return 'Sin fecha';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.detailModal]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{course.title}</Text>
            {userLevel === 1 && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => onEdit(course)}
                activeOpacity={0.7}
              >
                <Text style={styles.editIcon}> <MaterialIcons name="edit" size={20} color="#000" /></Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Descripción</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {course.description || 'Sin descripción'}
              </Text>
            </View>

            <Text style={styles.label}>Fecha de inicio</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{formatDate(course.start_date)}</Text>
            </View>

            <Text style={styles.label}>Fecha de fin</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{formatDate(course.end_date)}</Text>
            </View>

            {/* Componente de Participantes - solo para instructores */}
            {userLevel === 1 && (
              <View style={styles.participantsSection}>
                <CourseParticipants courseId={course.id} />
              </View>
            )}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={onClose}
            >
              <Text style={styles.submitButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EditCourseModal({
  visible,
  course,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  course: Course | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description || '');
    }
  }, [course]);

  const handleSubmit = async () => {
    if (!course) return;

    if (!title.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }

    setLoading(true);
    try {
      await updateCourse(course.id, {
        title: title.trim(),
        description: description.trim(),
      });
      Alert.alert('Éxito', 'Curso actualizado correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo actualizar el curso');
    } finally {
      setLoading(false);
    }
  };

  if (!course) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Editar Curso</Text>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ingresa el título del curso"
              placeholderTextColor="#999"
              editable={!loading}
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe el curso"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              editable={!loading}
            />
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CreateCourseModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }
    if (endDate < startDate) {
      Alert.alert('Error', 'La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    setLoading(true);
    try {
      await createCourse({
        title: title.trim(),
        description: description.trim(),
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
      });
      Alert.alert('Éxito', 'Curso creado correctamente');
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear el curso');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Nuevo Curso</Text>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ingresa el título del curso"
              placeholderTextColor="#999"
              editable={!loading}
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe el curso"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              editable={!loading}
            />

            <Text style={styles.label}>Fecha de inicio *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowStartPicker(true)}
              disabled={loading}
            >
              <Text style={styles.dateText}>{formatDisplayDate(startDate)}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowStartPicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setStartDate(selectedDate);
                  }
                }}
              />
            )}

            <Text style={styles.label}>Fecha de fin *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowEndPicker(true)}
              disabled={loading}
            >
              <Text style={styles.dateText}>{formatDisplayDate(endDate)}</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={startDate}
                onChange={(event, selectedDate) => {
                  setShowEndPicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setEndDate(selectedDate);
                  }
                }}
              />
            )}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Crear</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastFetchAt, setLastFetchAt] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Load user profile to determine course listing strategy
  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await fetchUserProfile();
      setUserLevel(profile.level);
      setUserId(profile.id);
      return profile;
    } catch (e) {
      console.error('Load user profile error', e);
      return null;
    }
  }, []);

  const loadCourses = useCallback(
    async (page: number, append: boolean = false, userIdParam?: number | null) => {
      try {
        // For level 2 (students), pass their user ID to fetch only their enrolled courses
        const { data: items, hasMore: more } = await fetchCoursesFromApi(
          page,
          userLevel === 2 ? (userIdParam || undefined) : undefined
        );
        if (append) {
          setCourses(prev => [...prev, ...items]);
        } else {
          setCourses(items);
        }
        setCurrentPage(page);
        setHasMore(more);
      } catch (e) {
        console.error('Load courses error', e);
      }
    },
    [userLevel]
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    const now = Date.now();
    if (now - lastFetchAt < 600) return;
    setLastFetchAt(now);

    setLoadingMore(true);
    try {
      await loadCourses(currentPage + 1, true, userId || undefined);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, currentPage, hasMore, lastFetchAt, loadCourses, userId]);

  const refreshCourses = useCallback(async () => {
    setInitialLoading(true);
    await loadCourses(1, false, userId || undefined);
    setInitialLoading(false);
  }, [loadCourses, userId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // First load user profile to know their level
        const profile = await loadUserProfile();
        if (mounted && profile) {
          // Then load courses based on user level
          const { data: items, hasMore: more } = await fetchCoursesFromApi(
            1,
            profile.level === 2 ? profile.id : undefined
          );
          if (mounted) {
            setCourses(items);
            setCurrentPage(1);
            setHasMore(more);
          }
        }
      } catch (e) {
        console.error('Load initial data error', e);
      } finally {
        if (mounted) setInitialLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadUserProfile]);

  const handleEdit = (course: Course) => {
    setDetailModalVisible(false);
    setSelectedCourse(course);
    setEditModalVisible(true);
  };

  const handleEditSuccess = async () => {
    await refreshCourses();
    setEditModalVisible(false);
  };

  const renderItem = ({ item }: { item: Course }) => (
    <CourseCard
      course={item}
      onPress={() => {
        setSelectedCourse(item);
        setDetailModalVisible(true);
      }}
    />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Cursos Disponibles</ThemedText>
      </ThemedView>

      {initialLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : courses.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={courses}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 12 }} /> : null}
        />
      )}

      {userLevel === 1 && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      <CourseDetailModal
        visible={detailModalVisible}
        course={selectedCourse}
        onClose={() => setDetailModalVisible(false)}
        onEdit={handleEdit}
        userLevel={userLevel}
      />

      {userLevel === 1 && (
        <EditCourseModal
          visible={editModalVisible}
          course={selectedCourse}
          onClose={() => setEditModalVisible(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {userLevel === 1 && (
        <CreateCourseModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSuccess={refreshCourses}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingVertical: 18,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  cardButton: {
    alignSelf: 'center',
    backgroundColor: '#20336d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
  },
  cardButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#20336d',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 10,
  },
  detailModal: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
    flex: 1,
  },
  editButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
  },
  editIcon: {
    fontSize: 18,
  },
  modalForm: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
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
  infoBox: {
    backgroundColor: '#ffffffff',
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  participantsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    minHeight: 200,
  },
});
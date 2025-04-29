import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { taskService, Task, CompleteTaskResponse } from '@/services/task.service';

export default function TaskScreen() {
  const colorScheme = useColorScheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'daily' | 'weekly' | 'one_time' | 'special'>('all');

  useEffect(() => {
    fetchTasks();
  }, [selectedType]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTasks(selectedType);
      setTasks(data);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      
      if (error.response) {
        // Xử lý lỗi 401 (Không được xác thực)
        if (error.response.status === 401) {
          Alert.alert(
            'Không được xác thực', 
            'Vui lòng đăng nhập lại để tiếp tục.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // TODO: Chuyển người dùng đến màn hình đăng nhập nếu cần
                  // navigation.navigate('Login');
                }
              }
            ]
          );
        } else {
          Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tải danh sách nhiệm vụ. Vui lòng thử lại.');
        }
      } else {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (error) {
      return 'Không xác định';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return 'calendar';
      case 'weekly':
        return 'calendar-outline';
      case 'one_time':
        return 'star';
      case 'special':
        return 'gift';
      case 'all':
        return 'apps';
      default:
        return 'help';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'daily':
        return 'Hằng ngày';
      case 'weekly':
        return 'Hằng tuần';
      case 'one_time':
        return 'Một lần';
      case 'special':
        return 'Đặc biệt';
      default:
        return 'Khác';
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      const result = await taskService.completeTask(taskId);
      if (result.success) {
        Alert.alert(
          'Thành công',
          `Bạn đã hoàn thành nhiệm vụ và nhận được ${result.reward} COBIC`,
          [{ text: 'OK', onPress: () => fetchTasks() }]
        );
      }
    } catch (error: any) {
      console.error('Error completing task:', error);
      
      if (error.response) {
        // Xử lý các mã lỗi cụ thể
        switch (error.response.status) {
          case 400:
            Alert.alert(
              'Không thể hoàn thành', 
              'Nhiệm vụ đã hoàn thành hoặc không thể hoàn thành.'
            );
            break;
          case 401:
            Alert.alert(
              'Không được xác thực', 
              'Vui lòng đăng nhập lại để tiếp tục.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // TODO: Chuyển người dùng đến màn hình đăng nhập nếu cần
                    // navigation.navigate('Login');
                  }
                }
              ]
            );
            break;
          case 404:
            Alert.alert(
              'Không tìm thấy', 
              'Không tìm thấy nhiệm vụ yêu cầu.'
            );
            break;
          default:
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể hoàn thành nhiệm vụ. Vui lòng thử lại.');
        }
      } else {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
      
      // Cập nhật lại danh sách nhiệm vụ để hiển thị trạng thái mới nhất
      fetchTasks();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.loadingText}>Đang tải danh sách nhiệm vụ...</ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <ThemedText style={styles.title}>Nhiệm vụ</ThemedText>
              <ThemedText style={styles.subtitle}>Hoàn thành nhiệm vụ để nhận COBIC</ThemedText>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterContainer}
              contentContainerStyle={styles.filterContent}
            >
              {['all', 'daily', 'weekly', 'one_time', 'special'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterButton,
                    selectedType === type && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedType(type as any)}
                >
                  <View style={styles.filterIconContainer}>
                    <Ionicons 
                      name={getTypeIcon(type)} 
                      size={20} 
                      color={selectedType === type ? '#fff' : Colors[colorScheme ?? 'light'].tint} 
                    />
                  </View>
                  <ThemedText lightColor={Colors.light.text} darkColor={Colors.light.text}
                    style={[
                      styles.filterButtonText,
                      selectedType === type && styles.filterButtonTextActive
                    ]}
                  >
                    {type === 'all' ? 'Tất cả' : getTypeName(type)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <ThemedView key={task.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <View style={styles.taskType}>
                      <View style={styles.taskTypeIconContainer}>
                        <Ionicons 
                          name={getTypeIcon(task.type)} 
                          size={24} 
                          color={Colors[colorScheme ?? 'light'].tint} 
                        />
                      </View>
                      <ThemedText style={styles.taskTypeText}>
                        {getTypeName(task.type)}
                      </ThemedText>
                    </View>
                    {task.completed ? (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                        <ThemedText style={styles.completedText}>Đã hoàn thành</ThemedText>
                      </View>
                    ) : (
                      <View style={styles.pendingBadge}>
                        <Ionicons name="time" size={18} color="#FF9800" />
                        <ThemedText style={styles.pendingText}>Đang chờ</ThemedText>
                      </View>
                    )}
                  </View>

                  <ThemedText style={styles.taskTitle}>{task.title}</ThemedText>
                  <ThemedText style={styles.taskDescription}>{task.description}</ThemedText>

                  <View style={styles.taskInfo}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconContainer}>
                        <Ionicons name="gift" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                      </View>
                      <ThemedText style={styles.infoText}>
                        <ThemedText style={styles.infoLabel}>Phần thưởng: </ThemedText>
                        {task.reward} COBIC
                      </ThemedText>
                    </View>
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconContainer}>
                        <Ionicons name="time" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                      </View>
                      <ThemedText style={styles.infoText}>
                        <ThemedText style={styles.infoLabel}>Thời gian: </ThemedText>
                        {formatDate(task.startDate)} - {formatDate(task.endDate)}
                      </ThemedText>
                    </View>
                    {task.requirements && (
                      <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                          <Ionicons name="list" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                        </View>
                        <ThemedText style={styles.infoText}>
                          <ThemedText style={styles.infoLabel}>Yêu cầu: </ThemedText>
                          {task.requirements}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <View style={styles.taskActions}>
                    {!task.completed && (
                      <TouchableOpacity
                        style={styles.completeButton}
                        onPress={() => handleCompleteTask(task.id)}
                      >
                        <View style={styles.completeButtonContent}>
                          <Ionicons name="checkmark-circle" size={20} color="#fff" />
                          <ThemedText style={styles.completeButtonText}>Hoàn thành</ThemedText>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </ThemedView>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="alert-circle" size={64} color={Colors[colorScheme ?? 'light'].tint} />
                </View>
                <ThemedText style={styles.emptyText}>Không có nhiệm vụ nào</ThemedText>
                <ThemedText style={styles.emptySubtext}>Hãy quay lại sau để xem các nhiệm vụ mới</ThemedText>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight:40
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  filterContainer: {
    marginHorizontal: -20,
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  filterIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTypeIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 12,
  },
  taskTypeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pendingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    opacity: 0.8,
  },
  taskInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginRight: 12,
  },
  infoText: {
    fontSize: 15,
    flex: 1,
  },
  infoLabel: {
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  taskActions: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  completeButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  completeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
}); 
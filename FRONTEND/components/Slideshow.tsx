import { StyleSheet, Text, View, Image, Dimensions, ScrollView, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import React, { useState, useRef } from 'react'
import { useRouter } from 'expo-router'

const { width } = Dimensions.get('window')

const Slideshow = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const router = useRouter()

  // Slideshow data with placeholder content (replace images when you add them)
  const slides = [
    {
      id: 1,
      image: require('../assets/slides/slide1.png'), // Using existing image as placeholder
      title: "Welcome to Jibuks",
      description: "Your journey starts here with our amazing platform"
    },
    {
      id: 2,
      image: require('../assets/slides/slide2.png'), // Using existing image as placeholder
      title: "Discover Amazing Features",
      description: "Explore what we have to offer and make the most of your experience"
    },
    {
      id: 3,
      image: require('../assets/slides/slide3.png'), // Using existing image as placeholder
      title: "Get Started Today",
      description: "Join thousands of satisfied users and begin your journey"
    },
    {
      id: 4,
      image: require('../assets/slides/slide4.png'), // Using existing image as placeholder
      title: "Complete Your Setup",
      description: "Finish setting up your account and unlock all features"
    }
  ]

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width
    const index = event.nativeEvent.contentOffset.x / slideSize
    const roundIndex = Math.round(index)
    setCurrentIndex(roundIndex)
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <Image 
              source={slide.image}
              style={styles.slideImage}
              resizeMode="contain"
            />
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDescription}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === currentIndex ? '#007AFF' : '#C4C4C4' }
            ]}
          />
        ))}
      </View>

      {/* Continue Button */}
      <TouchableOpacity 
        style={styles.continueButton}
        onPress={() => router.push('/auth')}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  )
}

export default Slideshow

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slideImage: {
    width: width * 0.8,
    height: 300,
    marginBottom: 30,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  slideDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  continueButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
})